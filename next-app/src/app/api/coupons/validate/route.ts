import { NextRequest } from 'next/server'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { COUPONS_COLLECTION } from '@/lib/coupons-collection'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: valida cupom. Query: code=XXX. Retorna dados do benefício sem consumir o cupom. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim()?.toUpperCase()
  if (!code || code.length < 3) {
    return Response.json({ valid: false, error: 'Código inválido' })
  }

  const adminToken = await getAdminToken()
  if (!adminToken) {
    return Response.json({ valid: false, error: 'Serviço indisponível' }, { status: 503 })
  }

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/${COUPONS_COLLECTION}/records?filter=${encodeURIComponent(`code="${code}"`)}&perPage=1&expand=plan_id`,
      { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' }
    )
    if (!res.ok) return Response.json({ valid: false, error: 'Cupom não encontrado' })
    const data = (await res.json()) as {
      items?: Array<{
        id: string
        code: string
        coupon_type?: string
        discount_percent?: number
        plan_id: string
        duration_days: number
        max_uses?: number
        used_count?: number
        active?: boolean
        expires_at?: string
        expand?: { plan_id?: { name?: string; slug?: string } }
      }>
    }
    const coupon = data.items?.[0]
    if (!coupon) return Response.json({ valid: false, error: 'Cupom não encontrado' })
    if (coupon.active === false) return Response.json({ valid: false, error: 'Cupom inativo' })
    if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) {
      return Response.json({ valid: false, error: 'Cupom expirado' })
    }
    const maxUses = coupon.max_uses != null ? Number(coupon.max_uses) : null
    const usedCount = Number(coupon.used_count) || 0
    if (maxUses != null && usedCount >= maxUses) {
      return Response.json({ valid: false, error: 'Cupom já utilizado ao máximo' })
    }
    const plan = coupon.expand?.plan_id
    return Response.json({
      valid: true,
      coupon_id: coupon.id,
      plan_id: coupon.plan_id,
      duration_days: Number(coupon.duration_days) || 30,
      plan_name: plan?.name || plan?.slug || 'Plano',
      coupon_type: coupon.coupon_type === 'percentage' ? 'percentage' : 'plan',
      discount_percent: coupon.coupon_type === 'percentage' ? Math.max(0, Math.min(100, Number(coupon.discount_percent) || 0)) : 0,
    })
  } catch {
    return Response.json({ valid: false, error: 'Erro ao validar cupom' }, { status: 500 })
  }
}
