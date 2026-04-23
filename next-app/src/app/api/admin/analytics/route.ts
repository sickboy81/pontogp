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
    ])

    let topProfilesByViews: { id: string; name: string; views: number; slug?: string }[] = []
    try {
      const res = await fetch(
        `${PB_URL}/api/collections/profiles/records?sort=-views&perPage=10&fields=id,name,views,slug`,
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
          views: p.views ?? 0,
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
