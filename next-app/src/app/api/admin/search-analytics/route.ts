import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const days = [7, 30, 90].includes(Number(request.nextUrl.searchParams.get('days'))) ? Number(request.nextUrl.searchParams.get('days')) : 30
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const token = (await getAdminToken()) || auth.token
  const url = `${PB_URL}/api/collections/search_events/records?perPage=500&sort=-created&filter=${encodeURIComponent(`created >= "${since}"`)}&fields=location_query,content_query,result_count,created`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return Response.json({ searches: 0, zeroResultSearches: 0, topTerms: [], unavailable: res.status === 404 })
  const data = await res.json() as { items?: Array<{ location_query?: string; content_query?: string; result_count?: number }> }
  const items = data.items || []
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const term of `${item.location_query || ''} ${item.content_query || ''}`.toLocaleLowerCase('pt-BR').split(/[,\s]+/).filter((v) => v.length >= 3)) counts.set(term, (counts.get(term) || 0) + 1)
  }
  return Response.json({ searches: items.length, zeroResultSearches: items.filter((i) => Number(i.result_count) === 0).length, topTerms: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([term, count]) => ({ term, count })) })
}
