import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: lista usuários (apenas admin). Query: page=1, perPage=20. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 20))

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/users/records?page=${page}&perPage=${perPage}&sort=-created`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
        cache: 'no-store',
      }
    )
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
