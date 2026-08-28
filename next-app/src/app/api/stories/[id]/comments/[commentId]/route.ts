import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { canModerateStory } from '@/lib/story-moderation.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

function relationId(value: unknown): string {
  return Array.isArray(value) ? String(value[0] || '') : typeof value === 'string' ? value : ''
}

async function ownerForStory(adminToken: string, storyId: string) {
  const storyRes = await fetch(`${PB_URL}/api/collections/stories/records/${encodeURIComponent(storyId)}?fields=profile`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
  if (!storyRes.ok) return { status: storyRes.status, ownerId: '' }
  const profileId = relationId(((await storyRes.json()) as { profile?: unknown }).profile)
  if (!profileId) return { status: 200, ownerId: '' }
  const profileRes = await fetch(`${PB_URL}/api/collections/profiles/records/${encodeURIComponent(profileId)}?fields=user`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
  if (!profileRes.ok) return { status: profileRes.status, ownerId: '' }
  return { status: 200, ownerId: relationId(((await profileRes.json()) as { user?: unknown }).user) }
}

async function deleteRelated(adminToken: string, collection: string, field: string, id: string) {
  const filter = `${field} = "${id}"`
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=500&filter=${encodeURIComponent(filter)}&fields=id`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
  if (!res.ok) return
  const data = (await res.json()) as { items?: Array<{ id: string }> }
  await Promise.all((data.items || []).map((item) => fetch(`${PB_URL}/api/collections/${collection}/records/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } })))
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  const viewerId = getUserIdFromToken(token || '')
  if (!viewerId) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const { id: storyId, commentId } = await params
  const adminToken = await getAdminToken()
  if (!adminToken) return Response.json({ error: 'Serviço indisponível' }, { status: 503 })
  try {
    const owner = await ownerForStory(adminToken, storyId)
    if (owner.status === 404) return Response.json({ error: 'Story não encontrada' }, { status: 404 })
    if (!canModerateStory({ storyOwnerId: owner.ownerId, viewerId })) return Response.json({ error: 'Apenas a dona da story pode moderar comentários' }, { status: 403 })
    const commentRes = await fetch(`${PB_URL}/api/collections/story_comments/records/${encodeURIComponent(commentId)}?fields=id,story`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
    if (commentRes.status === 404) return Response.json({ error: 'Comentário não encontrado' }, { status: 404 })
    if (!commentRes.ok) return Response.json({ error: 'Não foi possível validar o comentário' }, { status: 502 })
    const comment = (await commentRes.json()) as { story?: unknown }
    if (relationId(comment.story) !== storyId) return Response.json({ error: 'Comentário inválido' }, { status: 400 })
    const allCommentsRes = await fetch(`${PB_URL}/api/collections/story_comments/records?perPage=500&filter=${encodeURIComponent(`story = "${storyId}"`)}&fields=id,parent`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
    const allComments = allCommentsRes.ok ? (await allCommentsRes.json()) as { items?: Array<{ id: string; parent?: unknown }> } : { items: [] }
    const descendants = new Set<string>([commentId])
    let changed = true
    while (changed) {
      changed = false
      for (const item of allComments.items || []) {
        if (!descendants.has(item.id) && descendants.has(relationId(item.parent))) {
          descendants.add(item.id)
          changed = true
        }
      }
    }
    await Promise.all([...descendants].map((id) => deleteRelated(adminToken, 'comment_likes', 'comment', id)))
    const children = [...descendants].filter((id) => id !== commentId)
    await Promise.all(children.map((id) => fetch(`${PB_URL}/api/collections/story_comments/records/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } })))
    await fetch(`${PB_URL}/api/collections/story_comments/records/${encodeURIComponent(commentId)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Erro ao excluir comentário' }, { status: 500 })
  }
}
