import { NextRequest } from 'next/server'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

/** Campos: profiles.views; coleção profile_views (profile, viewer_ip, user_agent). Ver pocketbase-schema.json */
export const dynamic = 'force-dynamic'

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
    const [getRes, _] = await Promise.all([
      fetch(`${PB_URL}/api/collections/profiles/records/${id}?fields=id,views`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${PB_URL}/api/collections/profile_views/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          profile: id,
          viewer_ip: viewerIp,
          user_agent: userAgent,
        }),
      }),
    ])
    if (!getRes.ok) return Response.json({ ok: true })
    const record = (await getRes.json()) as { views?: number }
    const views = (Number(record.views) || 0) + 1
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
