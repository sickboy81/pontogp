import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** POST: toggle curtida (curtir / descurtir). Retorna { liked, count }. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Faça login para curtir' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const { id: storyId } = await params
  if (!storyId) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  const authHeader = { Authorization: `Bearer ${token}` }

  try {
    const listRes = await fetch(
      `${PB_URL}/api/collections/story_likes/records?filter=${encodeURIComponent(`story="${storyId}" && user="${userId}"`)}&perPage=1&fields=id`,
      { headers: authHeader, cache: 'no-store' }
    )
    const listData = listRes.ok ? (await listRes.json()) as { items?: { id: string }[] } : { items: [] }
    const existing = listData.items?.[0]

    if (existing) {
      const delRes = await fetch(`${PB_URL}/api/collections/story_likes/records/${existing.id}`, {
        method: 'DELETE',
        headers: authHeader,
      })
      if (!delRes.ok) {
        const err = (await delRes.json().catch(() => ({}))) as { message?: string }
        return Response.json(
          { error: err.message || 'Não foi possível descurtir' },
          { status: delRes.status }
        )
      }
      const adminToken = await getAdminToken()
      const countHeaders: HeadersInit | undefined = adminToken
        ? { Authorization: `Bearer ${adminToken}` }
        : undefined
      const countRes = await fetch(
        `${PB_URL}/api/collections/story_likes/records?filter=${encodeURIComponent(`story="${storyId}"`)}&perPage=1`,
        { headers: countHeaders, cache: 'no-store' }
      )
      const total = countRes.ok ? ((await countRes.json()) as { totalItems?: number }).totalItems ?? 0 : 0
      return Response.json({ liked: false, count: Math.max(0, total - 1) })
    }

    const createRes = await fetch(`${PB_URL}/api/collections/story_likes/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ story: storyId, user: userId }),
    })
    if (!createRes.ok) {
      const err = (await createRes.json().catch(() => ({}))) as { message?: string }
      return Response.json(
        { error: err.message || 'Não foi possível curtir' },
        { status: createRes.status }
      )
    }
    const adminToken = await getAdminToken()
    const countHeaders: HeadersInit | undefined = adminToken
      ? { Authorization: `Bearer ${adminToken}` }
      : undefined
    const countRes = await fetch(
      `${PB_URL}/api/collections/story_likes/records?filter=${encodeURIComponent(`story="${storyId}"`)}&perPage=1`,
      { headers: countHeaders, cache: 'no-store' }
    )
    const total = countRes.ok ? ((await countRes.json()) as { totalItems?: number }).totalItems ?? 0 : 0
    return Response.json({ liked: true, count: total })
  } catch {
    return Response.json({ error: 'Erro ao curtir' }, { status: 500 })
  }
}
