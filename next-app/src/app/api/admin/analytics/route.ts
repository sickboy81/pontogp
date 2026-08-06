import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

async function fetchCount(
  token: string,
  collection: string,
  filter = ''
): Promise<number> {
  try {
    const url = `${PB_URL}/api/collections/${collection}/records?perPage=1&fields=id${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return 0
    const data = await res.json()
    return data.totalItems ?? 0
  } catch {
    return 0
  }
}

async function fetchRows<T>(token: string, collection: string, filter = '', fields = 'created,profile'): Promise<T[]> {
  try {
    const url = `${PB_URL}/api/collections/${collection}/records?perPage=5000&fields=${encodeURIComponent(fields)}${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.items) ? data.items as T[] : []
  } catch {
    return []
  }
}

function dateFilter(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(0, 0, 0, 0)
  return `created >= "${d.toISOString()}"`
}

/** GET: analytics avançado (views, cliques, períodos, top perfis). Apenas admin. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const filter7 = dateFilter(7)
    const filter30 = dateFilter(30)

    const [
      totalViews,
      totalClicks,
      viewsLast7Days,
      viewsLast30Days,
      clicksLast7Days,
      clicksLast30Days,
      clicksWhatsapp,
      clicksTelegram,
      clicksPhone,
      clicksMessage,
      activeProfiles,
      totalUsers,
      activeStories,
      unreadContacts,
      pendingReports,
      viewRows,
      clickRows,
    ] = await Promise.all([
      fetchCount(auth.token, 'profile_views'),
      fetchCount(auth.token, 'profile_clicks'),
      fetchCount(auth.token, 'profile_views', filter7),
      fetchCount(auth.token, 'profile_views', filter30),
      fetchCount(auth.token, 'profile_clicks', filter7),
      fetchCount(auth.token, 'profile_clicks', filter30),
      fetchCount(auth.token, 'profile_clicks', 'contact_type = "whatsapp"'),
      fetchCount(auth.token, 'profile_clicks', 'contact_type = "telegram"'),
      fetchCount(auth.token, 'profile_clicks', 'contact_type = "phone"'),
      fetchCount(auth.token, 'profile_clicks', 'contact_type = "message"'),
      fetchCount(auth.token, 'profiles', 'status = "active"'),
      fetchCount(auth.token, 'users'),
      fetchCount(auth.token, 'stories', 'expires_at > "' + new Date().toISOString() + '"'),
      fetchCount(auth.token, 'contacts', 'read = false'),
      fetchCount(auth.token, 'reports', 'status = "pending"'),
      fetchRows<{ created?: string; profile?: string }>(auth.token, 'profile_views', filter30, 'created,profile'),
      fetchRows<{ created?: string; contact_type?: string }>(auth.token, 'profile_clicks', filter30, 'created,contact_type'),
    ])

    const dayKeys = Array.from({ length: 30 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (29 - index))
      return date.toISOString().slice(0, 10)
    })
    const daily = dayKeys.map((date) => ({ date, views: 0, clicks: 0 }))
    const dailyMap = new Map(daily.map((row) => [row.date, row]))
    for (const row of viewRows) {
      const date = row.created?.slice(0, 10)
      const target = date ? dailyMap.get(date) : undefined
      if (target) target.views += 1
    }
    for (const row of clickRows) {
      const date = row.created?.slice(0, 10)
      const target = date ? dailyMap.get(date) : undefined
      if (target) target.clicks += 1
    }

    const viewsByProfile = new Map<string, number>()
    for (const row of viewRows) {
      if (row.profile) viewsByProfile.set(row.profile, (viewsByProfile.get(row.profile) || 0) + 1)
    }
    let topProfilesByViews: { id: string; name: string; views: number; slug?: string }[] = []
    try {
      const topIds = [...viewsByProfile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
      const profileFilter = topIds.map(([id]) => `id="${id}"`).join(' || ')
      const res = await fetch(
        `${PB_URL}/api/collections/profiles/records?perPage=10&fields=id,name,slug${profileFilter ? `&filter=${encodeURIComponent(profileFilter)}` : ''}`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
          cache: 'no-store',
        }
      )
      if (res.ok) {
        const data = await res.json()
        topProfilesByViews = (data.items ?? []).map((p: { id: string; name: string; views: number; slug?: string }) => ({
          id: p.id,
          name: p.name ?? '–',
          views: viewsByProfile.get(p.id) || 0,
          slug: p.slug,
        }))
      }
    } catch {
      // ignore
    }

    return Response.json({
      totalViews,
      totalClicks,
      viewsLast7Days,
      viewsLast30Days,
      clicksLast7Days,
      clicksLast30Days,
      clicksByType: {
        whatsapp: clicksWhatsapp,
        telegram: clicksTelegram,
        phone: clicksPhone,
        message: clicksMessage,
      },
      daily,
      activeProfiles,
      totalUsers,
      activeStories,
      unreadContacts,
      pendingReports,
      ctr: totalViews > 0 ? Math.round((totalClicks / totalViews) * 1000) / 10 : 0,
      topProfilesByViews,
    })
  } catch {
    return Response.json(
      {
        totalViews: 0,
        totalClicks: 0,
        viewsLast7Days: 0,
        viewsLast30Days: 0,
        clicksLast7Days: 0,
        clicksLast30Days: 0,
        clicksByType: { whatsapp: 0, telegram: 0, phone: 0, message: 0 },
        topProfilesByViews: [],
      },
      { status: 200 }
    )
  }
}
