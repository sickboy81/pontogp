import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { canInteractWithStory } from '@/lib/story-interactions.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  const userId = token ? getUserIdFromToken(token) : null
  if (!token || !userId) return Response.json({ error: 'Faça login para curtir comentários' }, { status: 401 })

  const { id: storyId, commentId } = await params
  const adminToken = await getAdminToken()
  if (!adminToken) return Response.json({ error: 'Não foi possível validar o comentário' }, { status: 503 })
  const headers = { Authorization: `Bearer ${token}` }
  const adminHeaders = { Authorization: `Bearer ${adminToken}` }

  try {
    const commentRes = await fetch(
      `${PB_URL}/api/collections/story_comments/records/${encodeURIComponent(commentId)}?fields=id,story`,
      { headers: adminHeaders, cache: 'no-store' },
    )
    if (!commentRes.ok) return Response.json({ error: 'Comentário não encontrado' }, { status: 404 })
    const comment = (await commentRes.json()) as { story?: string }
    if (comment.story !== storyId) return Response.json({ error: 'Comentário inválido' }, { status: 400 })
    const storyRes = await fetch(
      `${PB_URL}/api/collections/stories/records/${encodeURIComponent(storyId)}?fields=id,active,expires_at`,
      { headers: adminHeaders, cache: 'no-store' },
    )
    if (!storyRes.ok) return Response.json({ error: 'Story não encontrada' }, { status: 404 })
    const story = (await storyRes.json()) as { active?: boolean; expires_at?: string }
    if (!canInteractWithStory(story)) return Response.json({ error: 'Esta story não aceita mais interações' }, { status: 410 })

    const filter = encodeURIComponent(`comment="${commentId}" && user="${userId}"`)
    const existingRes = await fetch(
      `${PB_URL}/api/collections/comment_likes/records?filter=${filter}&perPage=50&fields=id`,
      { headers, cache: 'no-store' },
    )
    if (!existingRes.ok) return Response.json({ error: 'Não foi possível verificar a curtida' }, { status: 502 })
    const existing = ((await existingRes.json()) as { items?: Array<{ id: string }> }).items || []
    let liked: boolean
    if (existing[0]) {
      const removeRes = await fetch(`${PB_URL}/api/collections/comment_likes/records/${existing[0].id}`, { method: 'DELETE', headers })
      if (!removeRes.ok) return Response.json({ error: 'Não foi possível remover a curtida' }, { status: 502 })
      liked = false
    } else {
      const createRes = await fetch(`${PB_URL}/api/collections/comment_likes/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ comment: commentId, user: userId }),
      })
      if (!createRes.ok) return Response.json({ error: 'Não foi possível curtir o comentário' }, { status: createRes.status })
      liked = true
    }

    const countRes = await fetch(
      `${PB_URL}/api/collections/comment_likes/records?filter=${encodeURIComponent(`comment="${commentId}"`)}&perPage=1`,
      { headers: adminHeaders, cache: 'no-store' },
    )
    const count = countRes.ok ? (((await countRes.json()) as { totalItems?: number }).totalItems ?? 0) : 0
    return Response.json({ liked, count })
  } catch {
    return Response.json({ error: 'Erro ao curtir comentário' }, { status: 500 })
  }
}
