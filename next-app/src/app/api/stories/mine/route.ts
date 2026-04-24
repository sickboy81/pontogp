import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

function toPBDate(d: Date = new Date()) {
  return d.toISOString().replace('T', ' ')
}

function storyOrFilter(ids: string[]): string {
  if (ids.length === 0) return 'id=""'
  return `(${ids.map((id) => `story="${id}"`).join(' || ')})`
}

type PBList<T> = { items?: T[] }

/** GET: stories do perfil do utilizador autenticado (inclui expiradas), com contagens. */
export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  try {
    const profRes = await fetch(
      `${PB_URL}/api/collections/profiles/records?filter=${encodeURIComponent(`user="${userId}"`)}&perPage=1&fields=id`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!profRes.ok) return Response.json({ items: [] })
    const profData = (await profRes.json()) as PBList<{ id: string }>
    const profileId = profData.items?.[0]?.id
    if (!profileId) return Response.json({ items: [] })

    const adminToken = await getAdminToken()
    const adminHeaders: HeadersInit | undefined = adminToken
      ? { Authorization: `Bearer ${adminToken}` }
      : undefined

    const storiesUrl = `${PB_URL}/api/collections/stories/records?filter=${encodeURIComponent(`profile="${profileId}"`)}&sort=-created&perPage=100&fields=id,type,text,views,expires_at,created,file,profile`
    const userStoryHeaders = { Authorization: `Bearer ${token}` } as const
    let storiesRes = await fetch(storiesUrl, {
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : userStoryHeaders,
      cache: 'no-store',
    })
    if (!storiesRes.ok && adminToken) {
      storiesRes = await fetch(storiesUrl, { headers: userStoryHeaders, cache: 'no-store' })
    }
    if (!storiesRes.ok) {
      return Response.json({ items: [] })
    }

    const storiesData = (await storiesRes.json()) as PBList<{
      id: string
      type?: string
      text?: string
      views?: number
      expires_at?: string
      created?: string
      file?: string
    }>
    const raw = storiesData.items || []
    const ids = raw.map((r) => r.id)

    const likesByStory = new Map<string, number>()
    const commentsByStory = new Map<string, number>()

    const chunk = 25
    for (let i = 0; i < ids.length; i += chunk) {
      const slice = ids.slice(i, i + chunk)
      const f = storyOrFilter(slice)

      if (adminToken) {
        const [likesRes, commentsRes] = await Promise.all([
          fetch(
            `${PB_URL}/api/collections/story_likes/records?filter=${encodeURIComponent(f)}&perPage=500&fields=story`,
            { headers: adminHeaders, cache: 'no-store' }
          ),
          fetch(
            `${PB_URL}/api/collections/story_comments/records?filter=${encodeURIComponent(f)}&perPage=500&fields=story`,
            { headers: adminHeaders, cache: 'no-store' }
          ),
        ])
        if (likesRes.ok) {
          const d = (await likesRes.json()) as PBList<{ story?: string }>
          for (const r of d.items || []) {
            const sid = r.story
            if (!sid) continue
            likesByStory.set(sid, (likesByStory.get(sid) ?? 0) + 1)
          }
        }
        if (commentsRes.ok) {
          const d = (await commentsRes.json()) as PBList<{ story?: string }>
          for (const r of d.items || []) {
            const sid = r.story
            if (!sid) continue
            commentsByStory.set(sid, (commentsByStory.get(sid) ?? 0) + 1)
          }
        }
      }
    }

    const now = toPBDate()
    const twelveHoursAgo = toPBDate(new Date(Date.now() - 12 * 60 * 60 * 1000))

    const items = raw.map((r) => {
      const file = r.file
      const fileUrl = file ? `${PB_URL}/api/files/stories/${r.id}/${file}` : ''
      const expRaw = r.expires_at
      const hasExpiry = expRaw != null && String(expRaw).trim() !== ''
      const active = hasExpiry
        ? String(expRaw) > now
        : (r.created || '') > twelveHoursAgo
      return {
        id: r.id,
        type: r.type || 'image',
        text: r.text || '',
        file: fileUrl,
        views: typeof r.views === 'number' ? r.views : 0,
        created: r.created,
        expires_at: r.expires_at,
        active,
        likesCount: likesByStory.get(r.id) ?? 0,
        commentsCount: commentsByStory.get(r.id) ?? 0,
      }
    })

    return Response.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return Response.json({ items: [] }, { headers: { 'Cache-Control': 'private, no-store' } })
  }
}
