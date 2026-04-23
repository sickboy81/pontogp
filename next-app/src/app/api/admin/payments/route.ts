import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: lista pagamentos (apenas admin). Query: page=1, perPage=20, status=paid|pending|all. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 20))
  const status = request.nextUrl.searchParams.get('status') || 'all'

  const filter = status === 'all' ? '' : `status = "${status}"`

  try {
    const url = `${PB_URL}/api/collections/payments/records?page=${page}&perPage=${perPage}&sort=-created${filter ? `&filter=${encodeURIComponent(filter)}` : ''}&expand=user,plan`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: 'no-store',
    })
    if (!res.ok) return Response.json({ items: [], totalItems: 0, page, perPage })
    const data = await res.json()
    const items = (data.items || []).map((r: Record<string, unknown>) => {
      const expand = r.expand as Record<string, unknown> | undefined
      const user = expand?.user as Record<string, unknown> | undefined
      const plan = expand?.plan as Record<string, unknown> | undefined
      return {
        id: r.id,
        user_id: r.user,
        user_email: user?.email ?? null,
        plan_id: r.plan,
        plan_name: plan?.name ?? plan?.slug ?? null,
        amount: r.amount,
        status: r.status,
        method: r.method,
        external_id: r.external_id,
        created: r.created,
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
