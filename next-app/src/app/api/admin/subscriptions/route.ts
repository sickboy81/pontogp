import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

async function getEffectiveToken(userToken: string): Promise<string> {
  const adminToken = await getAdminToken()
  return adminToken || userToken
}

/** O fluxo PIX/renovação grava o plano no `profiles`, não cria `subscriptions`. Estas linhas refletem a vigência real. */
function profileToSubscriptionRow(r: Record<string, unknown>, statusFilter: string) {
  const expand = (r.expand || {}) as Record<string, unknown>
  const user = expand.user as Record<string, unknown> | undefined
  const plan = expand.plan as Record<string, unknown> | undefined
  const searchExp = r.search_expires_at as string | undefined
  const searchOpen = !searchExp || searchExp === '' || new Date(searchExp) > new Date()
  const st = searchOpen ? 'active' : 'expired'
  if (statusFilter === 'canceled' || statusFilter === 'pending') {
    return null
  }
  if (statusFilter === 'active' && st !== 'active') return null
  if (statusFilter === 'expired' && st !== 'expired') return null

  return {
    id: r.id as string,
    user_id: r.user ?? null,
    user_email: (user?.email as string) ?? null,
    plan_id: r.plan ?? null,
    plan_name: (plan?.name as string) || (plan?.slug as string) || null,
    status: st,
    amount: 0,
    starts_at: (r.created as string) || (r.created_at as string) || (r.updated as string) || null,
    expires_at: searchExp || (r.contact_expires_at as string) || null,
    auto_renew: false,
    source: 'profile' as const,
  }
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

    let items: Array<Record<string, unknown>> = []
    let totalItems = 0

    if (res.ok) {
      const data = await res.json()
      items = (data.items || []).map((r: Record<string, unknown>) => {
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
          source: 'subscription' as const,
        }
      })
      totalItems = Number(data.totalItems) || items.length
    }

    if (items.length === 0) {
      const profRes = await fetch(
        `${PB_URL}/api/collections/profiles/records?page=1&perPage=500&sort=-updated&expand=user,plan`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
      )
      if (profRes.ok) {
        const pData = await profRes.json()
        const raw = (pData.items || []) as Record<string, unknown>[]
        const mapped = raw
          .map((row) => profileToSubscriptionRow(row, status))
          .filter((x): x is NonNullable<typeof x> => x != null)
        items = mapped as unknown as Array<Record<string, unknown>>
        totalItems = items.length
      }
    }

    return Response.json({
      items,
      totalItems,
      page,
      perPage,
    })
  } catch {
    return Response.json({ items: [], totalItems: 0, page, perPage })
  }
}
