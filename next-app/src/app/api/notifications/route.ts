import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** GET: lista notificações do usuário logado. Query: page=1, perPage=20, unreadOnly=false. */
export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 20))
  const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true'

  const filter = unreadOnly
    ? `recipient = "${userId}" && read = false`
    : `recipient = "${userId}"`

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/notifications/records?page=${page}&perPage=${perPage}&filter=${encodeURIComponent(filter)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!res.ok) return Response.json({ items: [], totalItems: 0, unreadCount: 0 })
    const data = await res.json()
    const items = (data.items || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      type: r.type,
      read: r.read,
      link: r.link,
      created: r.created ?? r.created_at,
    }))
    const countRes = await fetch(
      `${PB_URL}/api/collections/notifications/records?perPage=1&filter=${encodeURIComponent(`recipient = "${userId}" && read = false`)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    let unreadCount = 0
    if (countRes.ok) {
      const countData = await countRes.json()
      unreadCount = countData.totalItems ?? 0
    }
    return Response.json({ items, totalItems: data.totalItems ?? 0, unreadCount })
  } catch {
    return Response.json({ items: [], totalItems: 0, unreadCount: 0 })
  }
}
