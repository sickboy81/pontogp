import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'

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
    const rows: T[] = []
    for (let page = 1; page <= 20; page += 1) {
      const url = `${PB_URL}/api/collections/${collection}/records?perPage=500&page=${page}&fields=${encodeURIComponent(fields)}${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      if (!res.ok) return []
      const data = await res.json()
      if (Array.isArray(data.items)) rows.push(...data.items as T[])
      if (!data.totalPages || page >= data.totalPages) break
    }
    return rows
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
    const token = (await getAdminToken()) || auth.token
    const requestedDays = Number(request.nextUrl.searchParams.get('days'))
    const periodDays = [7, 30, 90].includes(requestedDays) ? requestedDays : 30
    const filterPeriod = dateFilter(periodDays)
    const filterPrevious = (() => {
      const end = new Date(); end.setDate(end.getDate() - periodDays); end.setHours(0, 0, 0, 0)
      const start = new Date(end); start.setDate(start.getDate() - periodDays)
      return `created >= "${start.toISOString()}" && created < "${end.toISOString()}"`
    })()

    const [
      totalViews,
      totalClicks,
      viewsLast7Days,
      viewsLast30Days,
      clicksLast7Days,
      clicksLast30Days,
      previousViews,
      previousClicks,
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
      fetchCount(token, 'profile_views'),
      fetchCount(token, 'profile_clicks'),
      fetchCount(token, 'profile_views', dateFilter(7)),
      fetchCount(token, 'profile_views', filterPeriod),
      fetchCount(token, 'profile_clicks', dateFilter(7)),
      fetchCount(token, 'profile_clicks', filterPeriod),
      fetchCount(token, 'profile_views', filterPrevious),
      fetchCount(token, 'profile_clicks', filterPrevious),
      fetchCount(token, 'profile_clicks', `${filterPeriod} && contact_type = "whatsapp"`),
      fetchCount(token, 'profile_clicks', `${filterPeriod} && contact_type = "telegram"`),
      fetchCount(token, 'profile_clicks', `${filterPeriod} && contact_type = "phone"`),
      fetchCount(token, 'profile_clicks', `${filterPeriod} && contact_type = "message"`),
      fetchCount(token, 'profiles', 'status = "active"'),
      fetchCount(token, 'users'),
      fetchCount(token, 'stories', 'expires_at > "' + new Date().toISOString() + '"'),
      fetchCount(token, 'contacts', 'read = false'),
      fetchCount(token, 'reports', 'status = "pending"'),
      fetchRows<{ created?: string; profile?: string }>(token, 'profile_views', filterPeriod, 'created,profile'),
      fetchRows<{ created?: string; contact_type?: string }>(token, 'profile_clicks', filterPeriod, 'created,contact_type'),
    ])

    const dayKeys = Array.from({ length: periodDays }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (periodDays - 1 - index))
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
          headers: { Authorization: `Bearer ${token}` },
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
      periodDays,
      previousViews,
      previousClicks,
      viewsChangePct: previousViews > 0 ? Math.round(((viewsLast30Days - previousViews) / previousViews) * 1000) / 10 : null,
      clicksChangePct: previousClicks > 0 ? Math.round(((clicksLast30Days - previousClicks) / previousClicks) * 1000) / 10 : null,
    })
  } catch {
    return Response.json(
      { error: 'Não foi possível consultar os dados reais de analytics.' },
      { status: 502 }
    )
  }
}
