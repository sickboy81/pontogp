import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { COUPONS_COLLECTION } from '@/lib/coupons-collection'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: lista cupons (apenas admin). Query: page=1, perPage=50. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const token = await getAdminToken()
  if (!token) return Response.json({ error: 'Serviço indisponível' }, { status: 503 })

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 50))

  try {
    const url = `${PB_URL}/api/collections/${COUPONS_COLLECTION}/records?page=${page}&perPage=${perPage}&sort=-created&expand=plan_id`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return Response.json({ items: [], totalItems: 0, page, perPage })
    const data = await res.json()
    const items = (data.items || []).map((r: Record<string, unknown>) => {
      const expand = r.expand as Record<string, unknown> | undefined
      const plan = expand?.plan_id as Record<string, unknown> | undefined
      return {
        id: r.id,
        code: r.code,
        plan_id: r.plan_id,
        plan_name: plan?.name ?? plan?.slug ?? null,
        coupon_type: r.coupon_type === 'percentage' ? 'percentage' : 'plan',
        discount_percent: r.discount_percent != null ? Number(r.discount_percent) : null,
        duration_days: Number(r.duration_days) ?? 30,
        max_uses: r.max_uses != null ? Number(r.max_uses) : null,
        used_count: Number(r.used_count) || 0,
        active: r.active !== false,
        expires_at: r.expires_at ?? null,
        created: r.created,
        updated: r.updated,
      }
    })
    return Response.json({
      items,
      totalItems: data.totalItems ?? 0,
      page,
      perPage,
    })
  } catch {
    return Response.json({ items: [], totalItems: 0, page, perPage })
  }
}

/** POST: cria cupom (apenas admin). Body: { code, coupon_type?, plan_id, duration_days, discount_percent?, max_uses?, expires_at?, active? } */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const token = await getAdminToken()
  if (!token) return Response.json({ error: 'Serviço indisponível' }, { status: 503 })

  try {
    const body = (await request.json()) as {
      code?: string
      coupon_type?: 'plan' | 'percentage'
      plan_id?: string
      duration_days?: number
      discount_percent?: number
      max_uses?: number
      expires_at?: string | null
      active?: boolean
    }
    const code = String(body.code ?? '').trim().toUpperCase().replace(/\s/g, '')
    if (!code || code.length < 3) {
      return Response.json({ error: 'Código inválido (mín. 3 caracteres)' }, { status: 400 })
    }
    const planId = body.plan_id
    if (!planId) return Response.json({ error: 'Plano obrigatório' }, { status: 400 })
    const couponType = body.coupon_type === 'percentage' ? 'percentage' : 'plan'
    const durationDays = Math.max(1, Math.min(365, Number(body.duration_days) || 30))
    const discountPercent = Math.max(0, Math.min(100, Number(body.discount_percent) || 0))

    const record: Record<string, unknown> = {
      code,
      plan_id: planId,
      coupon_type: couponType,
      duration_days: durationDays,
      discount_percent: couponType === 'percentage' ? discountPercent : 0,
      active: body.active !== false,
    }
    if (body.max_uses != null) record.max_uses = Math.max(0, Number(body.max_uses))
    if (body.expires_at !== undefined) record.expires_at = body.expires_at || ''

    const res = await fetch(`${PB_URL}/api/collections/${COUPONS_COLLECTION}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(record),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = (data as { message?: string }).message || (data as { error?: string }).error || 'Erro ao criar cupom'
      return Response.json({ error: msg }, { status: res.status >= 400 ? res.status : 500 })
    }
    return Response.json(data)
  } catch (e) {
    return Response.json({ error: 'Erro ao criar cupom' }, { status: 500 })
  }
}
