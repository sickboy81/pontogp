import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** GET: retorna total de curtidas e se o usuário logado curtiu. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: storyId } = await params
  if (!storyId) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  try {
    const adminToken = await getAdminToken()
    const countHeaders: HeadersInit | undefined = adminToken
      ? { Authorization: `Bearer ${adminToken}` }
      : undefined
    const countRes = await fetch(
      `${PB_URL}/api/collections/story_likes/records?filter=${encodeURIComponent(`story="${storyId}"`)}&perPage=1`,
      { headers: countHeaders, cache: 'no-store' }
    )
    const total = countRes.ok ? ((await countRes.json()) as { totalItems?: number }).totalItems ?? 0 : 0

    const token = getToken(request)
    let liked = false
    if (token) {
      const userId = getUserIdFromToken(token)
      if (userId) {
        const myRes = await fetch(
          `${PB_URL}/api/collections/story_likes/records?filter=${encodeURIComponent(`story="${storyId}" && user="${userId}"`)}&perPage=1&fields=id`,
          { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
        )
        if (myRes.ok) {
          const myData = (await myRes.json()) as { items?: unknown[] }
          liked = (myData.items?.length ?? 0) > 0
        }
      }
    }

    return Response.json({ count: total, liked })
  } catch {
    return Response.json({ count: 0, liked: false })
  }
}
