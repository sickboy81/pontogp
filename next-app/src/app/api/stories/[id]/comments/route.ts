import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { canInteractWithStory, normalizeStoryComment } from '@/lib/story-interactions.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** GET: lista comentários da story. */
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

    const res = await fetch(
      `${PB_URL}/api/collections/story_comments/records?filter=${encodeURIComponent(`story="${storyId}"`)}&perPage=50&sort=created&expand=user`,
      { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' }
    )
    if (!res.ok) {
      return Response.json({ error: 'Não foi possível carregar comentários' }, { status: res.status })
    }
    const data = (await res.json()) as { items?: Array<{ id: string; content: string; created: string; expand?: { user?: { name?: string } } }> }
    const items = (data.items || []).map((r) => ({
      id: r.id,
      content: r.content,
      created: r.created,
      userName: r.expand?.user?.name ?? 'Anônimo',
    }))
    return Response.json({ items })
  } catch {
    return Response.json({ error: 'Erro ao carregar comentários' }, { status: 500 })
  }
}

/** POST: cria comentário na story. Requer login. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Faça login para comentar' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const { id: storyId } = await params
  if (!storyId) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  let parsed: { content?: string }
  try {
    parsed = (await request.json()) as { content?: string }
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }
  const normalized = normalizeStoryComment(parsed.content)
  if (!normalized.ok) {
    return Response.json({ error: normalized.error }, { status: 400 })
  }
  const content = normalized.content

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

  const pbBody = JSON.stringify({ story: storyId, user: userId, content })
  const pbBodyMultiRel = JSON.stringify({ story: [storyId], user: [userId], content })
  const userHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } as const

  try {
    let res = await fetch(`${PB_URL}/api/collections/story_comments/records`, {
      method: 'POST',
      headers: userHeaders,
      body: pbBody,
    })
    // Alguns ambientes criaram "story_comments" com relation multi-select (maxSelect=0).
    // Nesse caso, tenta payload em array antes de retornar erro.
    if (!res.ok && (res.status === 400 || res.status === 422)) {
      res = await fetch(`${PB_URL}/api/collections/story_comments/records`, {
        method: 'POST',
        headers: userHeaders,
        body: pbBodyMultiRel,
      })
    }
    if (!res.ok) {
      const adminToken = await getAdminToken()
      if (adminToken && (res.status === 403 || res.status === 401)) {
        res = await fetch(`${PB_URL}/api/collections/story_comments/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
          body: pbBody,
        })
        if (!res.ok && (res.status === 400 || res.status === 422)) {
          res = await fetch(`${PB_URL}/api/collections/story_comments/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
            body: pbBodyMultiRel,
          })
        }
      }
    }
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      return Response.json({ error: err.message || 'Erro ao comentar' }, { status: res.status })
    }
    const record = (await res.json()) as { id: string; content: string; created?: string; updated?: string }
    return Response.json({
      id: record.id,
      content: record.content,
      created: record.created || record.updated || new Date().toISOString(),
    })
  } catch {
    return Response.json({ error: 'Erro ao comentar' }, { status: 500 })
  }
}
