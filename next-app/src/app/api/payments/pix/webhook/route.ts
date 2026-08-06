import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { COUPONS_COLLECTION } from '@/lib/coupons-collection'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { parseExpirationDurationsValue } from '@/lib/parse-expiration-settings'
import { enforceIpRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'

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
    if (!listRes.ok) return Response.json({ received: true }, { status: 200 })

    const listJson = (await listRes.json()) as {
      items?: { id: string; profile?: string; plan?: string; description?: string }[]
    }
    const items = listJson.items || []
    if (items.length === 0) return Response.json({ received: true }, { status: 200 })

    const record = items[0]
    const profileMatch = record.description?.match(/\|\s*PROFILE:([a-z0-9]{15})(?:\s*\||\s*$)/i)
    const profileId = record.profile || profileMatch?.[1] || null
    const authHeader = { Authorization: `Bearer ${token}` }

    await fetch(`${PB_URL}/api/collections/payments/records/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ status: newStatus }),
    })

    if (newStatus === 'paid' && profileId) {
      let planId = record.plan ?? null
      let searchDays = 30
      let contactDays = 30
      let autoBumpByDefault = false
      const couponMatch = record.description?.match(/\|\s*COUPON:([a-z0-9]{15})\s*$/i)
      const couponId = couponMatch?.[1] ?? null

      if (couponId) {
        try {
          const couponRes = await fetch(
            `${PB_URL}/api/collections/${COUPONS_COLLECTION}/records/${couponId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (couponRes.ok) {
            const coupon = (await couponRes.json()) as {
              plan_id?: string
              duration_days?: number
              used_count?: number
              active?: boolean
              max_uses?: number
              expires_at?: string
            }
            if (coupon.active !== false && coupon.plan_id) {
              const expired = coupon.expires_at && new Date(coupon.expires_at) <= new Date()
              const maxUses = coupon.max_uses != null ? Number(coupon.max_uses) : null
              const usedCount = Number(coupon.used_count) || 0
              if (!expired && (maxUses == null || usedCount < maxUses)) {
                planId = coupon.plan_id
                const days = Number(coupon.duration_days) || 30
                searchDays = days
                contactDays = days
                await fetch(`${PB_URL}/api/collections/${COUPONS_COLLECTION}/records/${couponId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', ...authHeader },
                  body: JSON.stringify({ used_count: usedCount + 1 }),
                })
              }
            }
          }
        } catch {
          // segue com plano do pagamento
        }
      }

      if (!planId) {
        planId = record.plan ?? null
      }
      if (planId) {
        try {
          const planRes = await fetch(
            `${PB_URL}/api/collections/plans/records/${planId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          let planSlug: string | undefined
          if (planRes.ok) {
            const planJson = (await planRes.json()) as { slug?: string; subscription_days?: number; daily_bumps?: number }
            planSlug = planJson.slug

            if (!couponId) {
              if (planJson.slug === 'gratis') {
                searchDays = 7
                contactDays = 7
              } else if (
                typeof planJson.subscription_days === 'number' &&
                planJson.subscription_days > 0
              ) {
                searchDays = planJson.subscription_days
                contactDays = planJson.subscription_days
              } else {
                searchDays = 30
                contactDays = 30
              }
            }

            autoBumpByDefault = planJson.slug !== 'gratis' && Number(planJson.daily_bumps) > 0

            const settingsRes = await fetch(
              `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "expiration_durations"')}&perPage=1&fields=value`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            if (settingsRes.ok) {
              const setData = (await settingsRes.json()) as { items?: { value?: unknown }[] }
              const durations = parseExpirationDurationsValue(setData.items?.[0]?.value)
              const bySlug = planSlug ? durations[planSlug] : undefined
              if (bySlug) {
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
        const searchExpires = new Date(now)
        searchExpires.setDate(searchExpires.getDate() + searchDays)
        const contactExpires = new Date(now)
        contactExpires.setDate(contactExpires.getDate() + contactDays)
        const searchExpiresAt = searchExpires.toISOString().replace('T', ' ').slice(0, 19)
        const contactExpiresAt = contactExpires.toISOString().replace('T', ' ').slice(0, 19)

        await fetch(`${PB_URL}/api/collections/profiles/records/${profileId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({
            plan: planId,
            search_expires_at: searchExpiresAt,
            contact_expires_at: contactExpiresAt,
            auto_bump: autoBumpByDefault,
          }),
        })
      }
    }

    return Response.json({ received: true }, { status: 200 })
  } catch {
    return Response.json({ received: true }, { status: 200 })
  }
}
