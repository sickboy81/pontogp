import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getProfileByUserId } from '@/lib/api/profiles'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { COUPONS_COLLECTION } from '@/lib/coupons-collection'

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

    const durationDays = Number(coupon.duration_days) || 30
    const now = new Date()
    const searchExpires = new Date(now)
    searchExpires.setDate(searchExpires.getDate() + durationDays)
    const contactExpires = new Date(now)
    contactExpires.setDate(contactExpires.getDate() + durationDays)
    const searchExpiresAt = searchExpires.toISOString().replace('T', ' ').slice(0, 19)
    const contactExpiresAt = contactExpires.toISOString().replace('T', ' ').slice(0, 19)

    await fetch(`${PB_URL}/api/collections/profiles/records/${profile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        plan: coupon.plan_id,
        search_expires_at: searchExpiresAt,
        contact_expires_at: contactExpiresAt,
      }),
    })

    await fetch(`${PB_URL}/api/collections/${COUPONS_COLLECTION}/records/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ used_count: usedCount + 1 }),
    })

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
