import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: lista denúncias (apenas admin). Query: status=pending|all, page, perPage. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const status = request.nextUrl.searchParams.get('status') || 'pending'
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 20))

  const filter = status === 'all' ? '' : 'status = "pending"'

  try {
    const url = `${PB_URL}/api/collections/reports/records?page=${page}&perPage=${perPage}${filter ? `&filter=${encodeURIComponent(filter)}` : ''}&expand=reported_profile,reported_by`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: 'no-store',
    })
    if (!res.ok) return Response.json({ items: [], totalItems: 0 })
    const data = await res.json()
    const items = (data.items || []).map((r: Record<string, unknown>) => mapReport(r))
    return Response.json({
      items,
      totalItems: data.totalItems ?? items.length,
      page,
      perPage,
    })
  } catch {
    return Response.json({ items: [], totalItems: 0 })
  }
}

function mapReport(r: Record<string, unknown>): Record<string, unknown> {
  const expand = r.expand as Record<string, unknown> | undefined
  const reportedProfile = expand?.reported_profile as Record<string, unknown> | undefined
  const reportedBy = expand?.reported_by as Record<string, unknown> | undefined
  return {
    id: r.id,
    reported_profile_id: r.reported_profile ?? r.reported_profile_id ?? r.profile_id,
    reason: r.reason ?? '',
    description: r.description ?? '',
    status: r.status ?? 'pending',
    created: r.created ?? r.created_at ?? r.date_created,
    reported_profile_name: reportedProfile?.name ?? null,
    reported_profile_slug: reportedProfile?.slug ?? null,
    reported_by_email: reportedBy?.email ?? null,
    reported_by_name: reportedBy?.name ?? null,
  }
}
