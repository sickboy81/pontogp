import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { parseExpirationDurationsValue } from '@/lib/parse-expiration-settings'
import { COUPON_REDEMPTIONS_COLLECTION, COUPONS_COLLECTION } from '@/lib/coupons-collection'
import { enforceIpRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'
import { isPaymentFulfilled, renewalBaseDate, shouldEnableVisualHighlight } from '@/lib/plan-entitlements.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const PIXGO_URL = 'https://pixgo.org/api/v1'
const PIXGO_API_KEY = process.env.PIXGO_API_KEY || ''
const PIXGO_WEBHOOK_SECRET = process.env.PIXGO_WEBHOOK_SECRET || ''
const MAX_WEBHOOK_AGE_SECONDS = 5 * 60

export const dynamic = 'force-dynamic'

function normalizeHexSignature(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith('sha256=')) return trimmed.slice('sha256='.length)
  return trimmed
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const aa = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (aa.length === 0 || bb.length === 0 || aa.length !== bb.length) return false
    return crypto.timingSafeEqual(aa, bb)
  } catch {
    return false
  }
}

/** POST: webhook PixGo.org - notifica pagamento completed/expired/refunded */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return Response.json({ error: 'Formato inválido' }, { status: 415 })
    }

    const limited = enforceIpRateLimit(request, 'pix-webhook', RATE_LIMIT_POLICIES.webhook)
    if (limited) return limited

    const rawBody = await request.text()
    if (!rawBody.trim()) {
      return Response.json({ error: 'Body vazio' }, { status: 400 })
    }

    if (PIXGO_WEBHOOK_SECRET) {
      const timestamp = request.headers.get('x-webhook-timestamp') || ''
      const provided = normalizeHexSignature(request.headers.get('x-webhook-signature') || '')
      const timestampSeconds = Number.parseInt(timestamp, 10)
      const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds)
      if (
        !/^\d+$/.test(timestamp) ||
        !Number.isFinite(timestampSeconds) ||
        ageSeconds > MAX_WEBHOOK_AGE_SECONDS
      ) {
        return Response.json({ error: 'Timestamp inválido ou expirado' }, { status: 401 })
      }

      const expected = crypto
        .createHmac('sha256', PIXGO_WEBHOOK_SECRET)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex')

      if (!provided || !safeEqualHex(provided, expected)) {
        return Response.json({ error: 'Assinatura inválida' }, { status: 401 })
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.error('[pix-webhook] PIXGO_WEBHOOK_SECRET ausente em produção.')
      return Response.json({ error: 'Webhook não configurado' }, { status: 503 })
    } else {
      console.warn('[pix-webhook] PIXGO_WEBHOOK_SECRET ausente; validação de assinatura desativada.')
    }

    const body = JSON.parse(rawBody) as {
      event?: string
      data?: { payment_id?: string; status?: string }
    }

    const event = body.event
    const paymentId = body.data?.payment_id

    if (!event || !paymentId) {
      return Response.json({ received: true }, { status: 200 })
    }

    if (
      event !== 'payment.completed' &&
      event !== 'payment.expired' &&
      event !== 'payment.refunded'
    ) {
      return Response.json({ received: true }, { status: 200 })
    }

    if (event === 'payment.completed') {
      if (!PIXGO_API_KEY) {
        console.error('[pix-webhook] PIXGO_API_KEY ausente; confirmação do pagamento indisponível.')
        return Response.json({ error: 'Confirmação indisponível' }, { status: 503 })
      }

      const statusRes = await fetch(`${PIXGO_URL}/payment/${encodeURIComponent(paymentId)}/status`, {
        headers: { 'X-API-Key': PIXGO_API_KEY },
        cache: 'no-store',
      })
      const statusJson = (await statusRes.json().catch(() => null)) as {
        success?: boolean
        data?: { status?: string }
      } | null
      if (
        !statusRes.ok ||
        !statusJson?.success ||
        statusJson.data?.status?.toLowerCase() !== 'completed'
      ) {
        console.error('[pix-webhook] Evento completed não confirmado pela API PixGo.', {
          paymentId,
          httpStatus: statusRes.status,
          paymentStatus: statusJson?.data?.status,
        })
        return Response.json({ error: 'Pagamento ainda não confirmado' }, { status: 503 })
      }
    }

    const newStatus =
      event === 'payment.completed'
        ? 'paid'
        : event === 'payment.refunded'
          ? 'refunded'
          : 'failed'

    const token = await getAdminToken()
    if (!token) {
      return Response.json({ received: true }, { status: 200 })
    }

    const listRes = await fetch(
      `${PB_URL}/api/collections/payments/records?filter=${encodeURIComponent(`external_id="${paymentId}"`)}&perPage=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    if (!listRes.ok) return Response.json({ error: 'Pagamento não localizado internamente' }, { status: event === 'payment.completed' ? 503 : 200 })

    const listJson = (await listRes.json()) as {
      items?: { id: string; user?: string; profile?: string; plan?: string; coupon?: string; description?: string; status?: string; fulfilled_at?: string }[]
    }
    const items = listJson.items || []
    if (items.length === 0) return Response.json({ error: 'Pagamento não localizado internamente' }, { status: event === 'payment.completed' ? 503 : 200 })

    const record = items[0]
    if (event === 'payment.completed' && isPaymentFulfilled(record)) {
      return Response.json({ received: true, duplicate: true }, { status: 200 })
    }
    const profileMatch = record.description?.match(/\|\s*PROFILE:([a-z0-9]{15})(?:\s*\||\s*$)/i)
    const profileId = record.profile || profileMatch?.[1] || null
    const authHeader = { Authorization: `Bearer ${token}` }

    if (event === 'payment.completed' && !profileId) {
      console.error('[pix-webhook] Cobrança sem perfil de destino.', { paymentId, recordId: record.id })
      return Response.json({ error: 'Cobrança sem perfil de destino' }, { status: 503 })
    }

    if (newStatus === 'paid' && profileId) {
      let planId = record.plan ?? null
      const periodMatch = record.description?.match(/\|\s*PERIOD:(weekly|monthly)(?:\s*\||\s*$)/i)
      const billingPeriod = periodMatch?.[1]?.toLowerCase() === 'weekly' ? 'weekly' : 'monthly'
      let searchDays = billingPeriod === 'weekly' ? 7 : 30
      let contactDays = billingPeriod === 'weekly' ? 7 : 30
      let autoBumpByDefault = false
      let visualHighlight = false
      if (planId) {
        try {
          const planRes = await fetch(
            `${PB_URL}/api/collections/plans/records/${planId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          let planSlug: string | undefined
          if (planRes.ok) {
            const planJson = (await planRes.json()) as { slug?: string; subscription_days?: number; daily_bumps?: number; featured?: boolean }
            planSlug = planJson.slug

            if (planJson.slug === 'gratis') {
                searchDays = 7
                contactDays = 7
            } else if (
                typeof planJson.subscription_days === 'number' &&
                planJson.subscription_days > 0
            ) {
                const configuredDays = billingPeriod === 'weekly' ? 7 : planJson.subscription_days
                searchDays = configuredDays
                contactDays = configuredDays
            } else {
                searchDays = 30
                contactDays = 30
            }

            autoBumpByDefault = planJson.slug !== 'gratis' && Number(planJson.daily_bumps) > 0
            visualHighlight = shouldEnableVisualHighlight(planJson)

            const settingsRes = await fetch(
              `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "expiration_durations"')}&perPage=1&fields=value`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            if (settingsRes.ok) {
              const setData = (await settingsRes.json()) as { items?: { value?: unknown }[] }
              const durations = parseExpirationDurationsValue(setData.items?.[0]?.value)
              const bySlug = planSlug ? durations[planSlug] : undefined
              if (billingPeriod === 'monthly' && bySlug) {
                if (typeof bySlug.contact_days === 'number' && bySlug.contact_days >= 1) {
                  contactDays = Math.max(1, Math.floor(bySlug.contact_days))
                }
                if (typeof bySlug.search_days === 'number' && bySlug.search_days >= 1) {
                  searchDays = Math.max(1, Math.floor(bySlug.search_days))
                }
              }
            }
          }
        } catch {
          // usa 30 dias
        }
        const now = new Date()
        const currentProfileRes = await fetch(`${PB_URL}/api/collections/profiles/records/${profileId}?fields=plan,search_expires_at,contact_expires_at`, { headers: authHeader, cache: 'no-store' })
        const currentProfile = currentProfileRes.ok ? await currentProfileRes.json() as { search_expires_at?: string; contact_expires_at?: string } : {}
        const searchExpires = new Date(renewalBaseDate(currentProfile.search_expires_at, now))
        searchExpires.setDate(searchExpires.getDate() + searchDays)
        const contactExpires = new Date(renewalBaseDate(currentProfile.contact_expires_at, now))
        contactExpires.setDate(contactExpires.getDate() + contactDays)
        const searchExpiresAt = searchExpires.toISOString().replace('T', ' ').slice(0, 19)
        const contactExpiresAt = contactExpires.toISOString().replace('T', ' ').slice(0, 19)

        const profilePatchRes = await fetch(`${PB_URL}/api/collections/profiles/records/${profileId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({
            plan: planId,
            search_expires_at: searchExpiresAt,
            contact_expires_at: contactExpiresAt,
            auto_bump: autoBumpByDefault,
            featured: visualHighlight,
            visual_highlight: visualHighlight,
          }),
        })
        if (!profilePatchRes.ok) {
          console.error('[pix-webhook] Falha ao ativar o plano no perfil.', { paymentId, profileId, status: profilePatchRes.status })
          return Response.json({ error: 'Plano não ativado' }, { status: 503 })
        }
      }
    }

    if (newStatus === 'refunded' && profileId) {
      const profileRes = await fetch(`${PB_URL}/api/collections/profiles/records/${profileId}?fields=id,plan`, { headers: authHeader, cache: 'no-store' })
      const profile = profileRes.ok ? await profileRes.json() as { plan?: string } : null
      if (profile?.plan && profile.plan === record.plan) {
        await fetch(`${PB_URL}/api/collections/profiles/records/${profileId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ plan: null, search_expires_at: '', contact_expires_at: '', auto_bump: false, featured: false, visual_highlight: false }),
        })
      }
    }

    if (record.coupon && (newStatus === 'paid' || newStatus === 'failed' || newStatus === 'refunded')) {
      const redemptionRes = await fetch(`${PB_URL}/api/collections/${COUPON_REDEMPTIONS_COLLECTION}/records?filter=${encodeURIComponent(`coupon_id="${record.coupon}" && user_id="${record.user || ''}" && status="reserved"`)}&perPage=1`, { headers: authHeader, cache: 'no-store' })
      const redemption = redemptionRes.ok ? (await redemptionRes.json() as { items?: Array<{ id: string }> }).items?.[0] : null
      if (redemption) {
        await fetch(`${PB_URL}/api/collections/${COUPON_REDEMPTIONS_COLLECTION}/records/${redemption.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ status: newStatus === 'paid' ? 'applied' : 'released' }),
        })
        if (newStatus === 'paid') {
          const couponRes = await fetch(`${PB_URL}/api/collections/${COUPONS_COLLECTION}/records/${record.coupon}?fields=used_count`, { headers: authHeader, cache: 'no-store' })
          if (couponRes.ok) {
            const couponData = await couponRes.json() as { used_count?: number }
            await fetch(`${PB_URL}/api/collections/${COUPONS_COLLECTION}/records/${record.coupon}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', ...authHeader },
              body: JSON.stringify({ used_count: (Number(couponData.used_count) || 0) + 1 }),
            })
          }
        }
      }
    }

    const paymentPatchRes = await fetch(`${PB_URL}/api/collections/payments/records/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify(newStatus === 'paid'
        ? { status: newStatus, fulfilled_at: new Date().toISOString() }
        : { status: newStatus }),
    })
    if (!paymentPatchRes.ok) {
      console.error('[pix-webhook] Falha ao atualizar status do pagamento.', { paymentId, status: paymentPatchRes.status })
      return Response.json({ error: 'Pagamento não atualizado' }, { status: 503 })
    }

    return Response.json({ received: true }, { status: 200 })
  } catch {
    return Response.json({ received: true }, { status: 200 })
  }
}
