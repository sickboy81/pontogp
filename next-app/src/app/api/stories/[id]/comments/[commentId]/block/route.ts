import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { blockKey, canBlockCommentAuthor, canModerateStory } from '@/lib/story-moderation.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'
function relationId(value: unknown): string { return Array.isArray(value) ? String(value[0] || '') : typeof value === 'string' ? value : '' }

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  const viewerId = getUserIdFromToken(token || '')
  if (!viewerId) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const { id: storyId, commentId } = await params
  const adminToken = await getAdminToken()
  if (!adminToken) return Response.json({ error: 'Serviço indisponível' }, { status: 503 })
  try {
    const storyRes = await fetch(`${PB_URL}/api/collections/stories/records/${encodeURIComponent(storyId)}?fields=profile`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
    if (storyRes.status === 404) return Response.json({ error: 'Story não encontrada' }, { status: 404 })
    if (!storyRes.ok) return Response.json({ error: 'Não foi possível validar a story' }, { status: 502 })
    const profileId = relationId(((await storyRes.json()) as { profile?: unknown }).profile)
    const profileRes = await fetch(`${PB_URL}/api/collections/profiles/records/${encodeURIComponent(profileId)}?fields=user`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
    const ownerId = profileRes.ok ? relationId(((await profileRes.json()) as { user?: unknown }).user) : ''
    if (!canModerateStory({ storyOwnerId: ownerId, viewerId })) return Response.json({ error: 'Apenas a dona da story pode bloquear usuários' }, { status: 403 })
    const commentRes = await fetch(`${PB_URL}/api/collections/story_comments/records/${encodeURIComponent(commentId)}?fields=story,user`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
    if (commentRes.status === 404) return Response.json({ error: 'Comentário não encontrado' }, { status: 404 })
    if (!commentRes.ok) return Response.json({ error: 'Não foi possível validar o comentário' }, { status: 502 })
    const comment = (await commentRes.json()) as { story?: unknown; user?: unknown }
    if (relationId(comment.story) !== storyId) return Response.json({ error: 'Comentário inválido' }, { status: 400 })
    const authorId = relationId(comment.user)
    if (!canBlockCommentAuthor({ authorId, viewerId })) return Response.json({ error: 'Não é possível bloquear este usuário' }, { status: 400 })
    const [userA, userB] = blockKey(viewerId, authorId)
    const filter = `user_a = "${userA}" && user_b = "${userB}"`
    const existingRes = await fetch(`${PB_URL}/api/collections/message_blocks/records?perPage=1&filter=${encodeURIComponent(filter)}`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
    const existingData = existingRes.ok ? (await existingRes.json()) as { items?: Array<{ id: string }> } : { items: [] }
    const existing = existingData.items?.[0]
    const res = existing
      ? await fetch(`${PB_URL}/api/collections/message_blocks/records/${existing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ blocked: true }) })
      : await fetch(`${PB_URL}/api/collections/message_blocks/records`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ user_a: userA, user_b: userB, blocked: true }) })
    if (!res.ok) return Response.json({ error: 'Não foi possível bloquear o usuário' }, { status: res.status })
    return Response.json({ blocked: true, userId: authorId })
  } catch {
    return Response.json({ error: 'Erro ao bloquear usuário' }, { status: 500 })
  }
}
