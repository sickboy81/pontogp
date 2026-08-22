import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getProfileByUserId } from '@/lib/api/profiles'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { COUPON_REDEMPTIONS_COLLECTION, COUPONS_COLLECTION } from '@/lib/coupons-collection'
import { profileVisualEntitlementPatch, renewalExpiryDate } from '@/lib/plan-entitlements.mjs'
import { normalizeCouponType } from '@/lib/coupon-contract.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** POST: aplica cupom ao perfil do usuário logado. Body: { code }. Atualiza plan, search_expires_at, contact_expires_at e incrementa used_count do cupom. */
export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Faça login para aplicar cupom' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const profile = await getProfileByUserId(userId, token)
  if (!profile) return Response.json({ error: 'Você ainda não tem um perfil. Crie um perfil primeiro.' }, { status: 400 })

  let body: { code?: string }
  try {
    body = (await request.json()) as { code?: string }
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }
  const code = body.code?.trim()?.toUpperCase()
  if (!code) return Response.json({ error: 'Informe o código do cupom' }, { status: 400 })

  const adminToken = await getAdminToken()
  if (!adminToken) return Response.json({ error: 'Serviço indisponível' }, { status: 503 })

  const authHeader = { Authorization: `Bearer ${adminToken}` }

  try {
    const listRes = await fetch(
      `${PB_URL}/api/collections/${COUPONS_COLLECTION}/records?filter=${encodeURIComponent(`code="${code}"`)}&perPage=1`,
      { headers: authHeader, cache: 'no-store' }
    )
    if (!listRes.ok) return Response.json({ error: 'Erro ao validar cupom' }, { status: 502 })
    const listData = (await listRes.json()) as {
      items?: Array<{
        id: string
        plan_id: string
        coupon_type?: string
        duration_days: number
        max_uses?: number
        used_count?: number
        active?: boolean
        expires_at?: string
      }>
    }
    const coupon = listData.items?.[0]
    if (!coupon) return Response.json({ error: 'Cupom não encontrado' }, { status: 404 })
    if (coupon.active === false) return Response.json({ error: 'Cupom inativo' }, { status: 400 })
    if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) {
      return Response.json({ error: 'Cupom expirado' }, { status: 400 })
    }
    const maxUses = coupon.max_uses != null ? Number(coupon.max_uses) : null
    const usedCount = Number(coupon.used_count) || 0
    if (maxUses != null && usedCount >= maxUses) {
      return Response.json({ error: 'Cupom já utilizado ao máximo' }, { status: 400 })
    }
    if (normalizeCouponType(coupon.coupon_type) === 'percentage') {
      return Response.json({ error: 'Cupons de desconto devem ser usados no pagamento PIX.' }, { status: 400 })
    }

    // A unique reservation key makes the redemption decision atomic in PocketBase.
    // The legacy used_count remains for display/backward compatibility only.
    const existingRes = await fetch(
      `${PB_URL}/api/collections/${COUPON_REDEMPTIONS_COLLECTION}/records?filter=${encodeURIComponent(`coupon_id="${coupon.id}" && user_id="${userId}" && status!="released"`)}&perPage=1`,
      { headers: authHeader, cache: 'no-store' }
    )
    if (existingRes.ok) {
      const existingData = (await existingRes.json()) as { items?: unknown[] }
      if ((existingData.items?.length || 0) > 0) {
        return Response.json({ error: 'Este cupom já foi utilizado nesta conta.' }, { status: 400 })
      }
    }

    const planRes = await fetch(`${PB_URL}/api/collections/plans/records/${coupon.plan_id}?fields=id,slug,featured,daily_bumps`, {
      headers: authHeader,
      cache: 'no-store',
    })
    if (!planRes.ok) return Response.json({ error: 'Plano do cupom não encontrado' }, { status: 400 })
    const plan = (await planRes.json()) as { id?: string; slug?: string; featured?: boolean; daily_bumps?: number }

    let reservationId: string | null = null
    const reservationLimit = maxUses == null ? 1 : Math.max(0, maxUses)
    for (let slot = 0; slot < reservationLimit; slot += 1) {
      const reservationKey = maxUses == null ? `${coupon.id}:${userId}` : `${coupon.id}:${slot}`
      const reservationRes = await fetch(`${PB_URL}/api/collections/${COUPON_REDEMPTIONS_COLLECTION}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          reservation_key: reservationKey,
          coupon_id: coupon.id,
          user_id: userId,
          status: 'reserved',
        }),
      })
      if (reservationRes.ok) {
        const reservation = (await reservationRes.json()) as { id?: string }
        reservationId = reservation.id || null
        break
      }
      if (reservationRes.status !== 400) break
    }
    if (!reservationId) {
      return Response.json({ error: maxUses != null ? 'Cupom já utilizado ao máximo' : 'Cupom indisponível' }, { status: 400 })
    }

    const durationDays = Number(coupon.duration_days) || 30
    const now = new Date()
    const searchExpires = renewalExpiryDate(profile.search_expires_at, durationDays, now)
    const contactExpires = renewalExpiryDate(profile.contact_expires_at, durationDays, now)
    const searchExpiresAt = searchExpires.toISOString().replace('T', ' ').slice(0, 19)
    const contactExpiresAt = contactExpires.toISOString().replace('T', ' ').slice(0, 19)

    const profileRes = await fetch(`${PB_URL}/api/collections/profiles/records/${profile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        plan: coupon.plan_id,
        search_expires_at: searchExpiresAt,
        contact_expires_at: contactExpiresAt,
        auto_bump: plan.slug !== 'gratis' && Number(plan.daily_bumps) > 0,
        ...profileVisualEntitlementPatch(plan),
      }),
    })
    if (!profileRes.ok) {
      await fetch(`${PB_URL}/api/collections/${COUPON_REDEMPTIONS_COLLECTION}/records/${reservationId}`, {
        method: 'DELETE',
        headers: authHeader,
      }).catch(() => {})
      return Response.json({ error: 'Não foi possível atualizar seu perfil com o cupom.' }, { status: 502 })
    }

    const reservationUpdateRes = await fetch(`${PB_URL}/api/collections/${COUPON_REDEMPTIONS_COLLECTION}/records/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ status: 'applied' }),
    })
    if (!reservationUpdateRes.ok) {
      return Response.json({ error: 'Perfil atualizado, mas não foi possível registrar o uso do cupom. Contate o suporte.' }, { status: 502 })
    }

    // Keep the old counter synchronized for the admin UI, without using it as the lock.
    await fetch(`${PB_URL}/api/collections/${COUPONS_COLLECTION}/records/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ used_count: Math.max(usedCount + 1, 1) }),
    }).catch(() => {})

    return Response.json({
      success: true,
      message: `Cupom aplicado! Seu anúncio está ativo por ${durationDays} dias.`,
      duration_days: durationDays,
      plan_id: coupon.plan_id,
    })
  } catch {
    return Response.json({ error: 'Erro ao aplicar cupom' }, { status: 500 })
  }
}
