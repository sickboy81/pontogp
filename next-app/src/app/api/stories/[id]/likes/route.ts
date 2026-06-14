import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { canInteractWithStory } from '@/lib/story-interactions.mjs'

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
    if (!adminToken) {
      return Response.json({ error: 'Não foi possível validar a story' }, { status: 503 })
    }

    const storyRes = await fetch(
      `${PB_URL}/api/collections/stories/records/${storyId}?fields=id,active,expires_at`,
      { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' },
    )
    if (storyRes.status === 404) {
      return Response.json({ error: 'Story não encontrada' }, { status: 404 })
    }
    if (!storyRes.ok) {
      return Response.json({ error: 'Não foi possível validar a story' }, { status: 502 })
    }
    const story = (await storyRes.json()) as { active?: boolean; expires_at?: string }
    if (!canInteractWithStory(story)) {
      return Response.json({ error: 'Esta story não aceita mais interações' }, { status: 410 })
    }

    const countRes = await fetch(
      `${PB_URL}/api/collections/story_likes/records?filter=${encodeURIComponent(`story="${storyId}"`)}&perPage=1`,
      { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' }
    )
    if (!countRes.ok) {
      return Response.json({ error: 'Não foi possível carregar curtidas' }, { status: countRes.status })
    }
    const total = ((await countRes.json()) as { totalItems?: number }).totalItems ?? 0

    const token = getToken(request)
    let liked = false
    if (token) {
      const userId = getUserIdFromToken(token)
      if (userId) {
        const myRes = await fetch(
          `${PB_URL}/api/collections/story_likes/records?filter=${encodeURIComponent(`story="${storyId}" && user="${userId}"`)}&perPage=2&fields=id`,
          { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
        )
        if (!myRes.ok) {
          return Response.json({ error: 'Não foi possível verificar sua curtida' }, { status: myRes.status })
        }
        const myData = (await myRes.json()) as { items?: unknown[] }
        liked = (myData.items?.length ?? 0) > 0
      }
    }

    return Response.json({ count: total, liked })
  } catch {
    return Response.json({ error: 'Erro ao carregar curtidas' }, { status: 500 })
  }
}
