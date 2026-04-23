import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: lista usuários (apenas admin). Query: page, perPage, q=busca em email/nome. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 20))
  const q = (request.nextUrl.searchParams.get('q') || '').trim()
  const token = (await getAdminToken()) || auth.token

  let filter = ''
  if (q.length >= 2) {
    const esc = q.replace(/"/g, '\\"')
    filter = `email ~ "${esc}" || name ~ "${esc}"`
  }

  try {
    const base = `${PB_URL}/api/collections/users/records?page=${page}&perPage=${perPage}&sort=-created`
    const url = filter
      ? `${base}&filter=${encodeURIComponent(filter)}`
      : base
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return Response.json({ items: [], totalItems: 0 })
    const data = await res.json()
    const items = (data.items || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      status: r.status,
      verified: r.verified,
      created: r.created,
    }))
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
