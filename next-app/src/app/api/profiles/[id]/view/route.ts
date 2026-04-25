import { NextRequest } from 'next/server'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const VIEW_DEDUP_HOURS = 6

/** Campos: profiles.views; coleção profile_views (profile, viewer_ip, user_agent). Ver pocketbase-schema.json */
export const dynamic = 'force-dynamic'

function toPBDate(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 19)
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

  const viewerIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || ''
  const userAgent = request.headers.get('user-agent') || ''

  try {
    const since = new Date(Date.now() - VIEW_DEDUP_HOURS * 60 * 60 * 1000)
    if (viewerIp || userAgent) {
      const dedupParts = [`profile="${id}"`, `created >= "${toPBDate(since)}"`]
      if (viewerIp) dedupParts.push(`viewer_ip="${viewerIp.replace(/"/g, '')}"`)
      if (userAgent) dedupParts.push(`user_agent="${userAgent.replace(/"/g, '')}"`)
      const dedupRes = await fetch(
        `${PB_URL}/api/collections/profile_views/records?perPage=1&fields=id&filter=${encodeURIComponent(dedupParts.join(' && '))}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (dedupRes.ok) {
        const dedup = await dedupRes.json()
        if ((dedup.totalItems ?? 0) > 0) return Response.json({ ok: true, deduped: true })
      }
    }

    const createRes = await fetch(`${PB_URL}/api/collections/profile_views/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        profile: id,
        viewer_ip: viewerIp,
        user_agent: userAgent,
      }),
    })
    if (!createRes.ok) return Response.json({ ok: true })

    const views = await countProfileViews(token, id)
    if (views === null) return Response.json({ ok: true })
    await fetch(`${PB_URL}/api/collections/profiles/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ views }),
    })
  } catch {
    // ignore
  }
  return Response.json({ ok: true })
}
