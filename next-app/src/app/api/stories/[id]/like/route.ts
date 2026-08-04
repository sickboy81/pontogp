import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { canInteractWithStory } from '@/lib/story-interactions.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

async function loadStoryForInteraction(storyId: string, adminToken: string) {
  const res = await fetch(
    `${PB_URL}/api/collections/stories/records/${storyId}?fields=id,active,expires_at`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
      cache: 'no-store',
    },
  )

  if (res.status === 404) return { status: 404 as const, story: null }
  if (!res.ok) return { status: 502 as const, story: null }

  const story = (await res.json()) as { id: string; active?: boolean; expires_at?: string }
  if (!canInteractWithStory(story)) return { status: 410 as const, story }

  return { status: 200 as const, story }
}

async function fetchStoryLikeCount(storyId: string, adminToken: string) {
  const countRes = await fetch(
    `${PB_URL}/api/collections/story_likes/records?filter=${encodeURIComponent(`story="${storyId}"`)}&perPage=1`,
    { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' },
  )
  if (!countRes.ok) throw new Error('Erro ao contar curtidas')
  return ((await countRes.json()) as { totalItems?: number }).totalItems ?? 0
}

/** POST: toggle curtida (só utilizador autenticado). Retorna { liked, count }. */
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

  const adminToken = await getAdminToken()
  if (!adminToken) {
    return Response.json({ error: 'Não foi possível validar a story' }, { status: 503 })
  }

  const storyState = await loadStoryForInteraction(storyId, adminToken)
  if (storyState.status === 404) {
    return Response.json({ error: 'Story não encontrada' }, { status: 404 })
  }
  if (storyState.status === 410) {
    return Response.json({ error: 'Esta story não aceita mais interações' }, { status: 410 })
  }
  if (storyState.status !== 200) {
    return Response.json({ error: 'Não foi possível validar a story' }, { status: 502 })
  }

  const authHeader = { Authorization: `Bearer ${token}` }

  try {
    const listRes = await fetch(
      `${PB_URL}/api/collections/story_likes/records?filter=${encodeURIComponent(`story="${storyId}" && user="${userId}"`)}&sort=${encodeURIComponent('created,id')}&perPage=50&fields=id`,
      { headers: authHeader, cache: 'no-store' }
    )
    if (!listRes.ok) {
      const err = (await listRes.json().catch(() => ({}))) as { message?: string }
      return Response.json(
        { error: err.message || 'Não foi possível verificar curtidas existentes' },
        { status: listRes.status },
      )
    }
    const listData = (await listRes.json()) as { items?: { id: string }[] }
    const existingItems = Array.isArray(listData.items) ? listData.items : []
    const [existing, ...duplicates] = existingItems

    if (existing) {
      for (const duplicate of duplicates) {
        await fetch(`${PB_URL}/api/collections/story_likes/records/${duplicate.id}`, {
          method: 'DELETE',
          headers: authHeader,
        }).catch(() => {})
      }

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
      const total = await fetchStoryLikeCount(storyId, adminToken)
      return Response.json({ liked: false, count: Math.max(0, total) })
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
    const total = await fetchStoryLikeCount(storyId, adminToken)
    return Response.json({ liked: true, count: total })
  } catch {
    return Response.json({ error: 'Erro ao curtir' }, { status: 500 })
  }
}
