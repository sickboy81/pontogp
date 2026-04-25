import { NextRequest } from 'next/server'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const VIEW_DEDUP_HOURS = 6
const VIEWER_COOKIE = 'cv_viewer_id'

/** Campos: profiles.views; coleção profile_views (profile, viewer_ip, user_agent). Ver pocketbase-schema.json */
export const dynamic = 'force-dynamic'

function toPBDate(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function normalizeStoredIdentityValue(value: string): string {
  return value.replace(/"/g, '').slice(0, 500)
}

function getHeaderIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-client-ip') ||
    ''
  )
}

function getViewerIdentity(request: NextRequest): {
  viewerIp: string
  userAgent: string
  viewerId: string | null
  shouldSetCookie: boolean
} {
  const headerIp = getHeaderIp(request)
  const headerUserAgent = request.headers.get('user-agent') || ''
  const cookieViewerId = request.cookies.get(VIEWER_COOKIE)?.value || ''
  const needsAnonymousId = !headerIp || !headerUserAgent
  const viewerId = needsAnonymousId ? cookieViewerId || crypto.randomUUID() : null

  return {
    viewerIp: headerIp || `anon:${viewerId}`,
    userAgent: headerUserAgent || `anon:${viewerId}`,
    viewerId,
    shouldSetCookie: needsAnonymousId && !cookieViewerId,
  }
}

function jsonOk(body: Record<string, unknown>, identity?: { viewerId: string | null; shouldSetCookie: boolean }) {
  if (identity?.shouldSetCookie && identity.viewerId) {
    return Response.json(body, {
      headers: {
        'Set-Cookie': `${VIEWER_COOKIE}=${identity.viewerId}; Path=/; Max-Age=15552000; SameSite=Lax; HttpOnly`,
      },
    })
  }
  return Response.json(body)
}

async function countProfileViews(token: string, profileId: string): Promise<number | null> {
  const res = await fetch(
    `${PB_URL}/api/collections/profile_views/records?perPage=1&fields=id&filter=${encodeURIComponent(`profile="${profileId}"`)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const data = (await res.json()) as { totalItems?: number }
  return data.totalItems ?? 0
}

/** POST: registra visualização. Incrementa profiles.views e cria registro em profile_views (schema). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return Response.json({ error: 'id obrigatório' }, { status: 400 })

  const token = await getAdminToken()
  if (!token) return Response.json({ ok: true })

  const identity = getViewerIdentity(request)
  const { viewerIp, userAgent } = identity
  const storedViewerIp = normalizeStoredIdentityValue(viewerIp)
  const storedUserAgent = normalizeStoredIdentityValue(userAgent)

  try {
    const since = new Date(Date.now() - VIEW_DEDUP_HOURS * 60 * 60 * 1000)
    const dedupParts = [
      `profile="${id}"`,
      `created >= "${toPBDate(since)}"`,
      `viewer_ip="${storedViewerIp}"`,
      `user_agent="${storedUserAgent}"`,
    ]
    const dedupRes = await fetch(
      `${PB_URL}/api/collections/profile_views/records?perPage=1&fields=id&filter=${encodeURIComponent(dedupParts.join(' && '))}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (dedupRes.ok) {
      const dedup = await dedupRes.json()
      if ((dedup.totalItems ?? 0) > 0) return jsonOk({ ok: true, deduped: true }, identity)
    }

    const createRes = await fetch(`${PB_URL}/api/collections/profile_views/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        profile: id,
        viewer_ip: storedViewerIp,
        user_agent: storedUserAgent,
      }),
    })
    if (!createRes.ok) return jsonOk({ ok: true }, identity)

    const views = await countProfileViews(token, id)
    if (views === null) return jsonOk({ ok: true }, identity)
    await fetch(`${PB_URL}/api/collections/profiles/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ views }),
    })
  } catch {
    // ignore
  }
  return jsonOk({ ok: true }, identity)
}