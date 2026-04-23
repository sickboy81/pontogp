import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

async function getEffectiveToken(userToken: string): Promise<string> {
  const adminToken = await getAdminToken()
  return adminToken || userToken
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 20))
  const status = (request.nextUrl.searchParams.get('status') || 'all').trim()

  let filter = ''
  if (status !== 'all') filter = `status = "${status}"`

  try {
    const token = await getEffectiveToken(auth.token)
    const url = `${PB_URL}/api/collections/subscriptions/records?page=${page}&perPage=${perPage}&sort=-created${filter ? `&filter=${encodeURIComponent(filter)}` : ''}&expand=user,plan`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    // Collection pode não existir em alguns ambientes antigos.
    if (!res.ok) return Response.json({ items: [], totalItems: 0, page, perPage })

    const data = await res.json()
    const items = (data.items || []).map((r: Record<string, unknown>) => {
      const expand = r.expand as Record<string, unknown> | undefined
      const user = expand?.user as Record<string, unknown> | undefined
      const plan = expand?.plan as Record<string, unknown> | undefined

      return {
        id: r.id,
        user_id: r.user ?? null,
        user_email: user?.email ?? null,
        plan_id: r.plan ?? null,
        plan_name: plan?.name ?? plan?.slug ?? null,
        status: r.status ?? null,
        amount: Number(r.amount) || 0,
        starts_at: r.starts_at ?? null,
        expires_at: r.expires_at ?? null,
        auto_renew: !!r.auto_renew,
        created: r.created ?? null,
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
