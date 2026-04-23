import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { mapProfile } from '@/lib/api/profiles'
import type { Profile } from '@/lib/types'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/favorites/records?perPage=100&expand=profile,profile.photos,profile.videos,profile.audio`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return Response.json([])
    const data = await res.json()
    const items = data.items || []
    const mappedProfiles = items
      .map((item: { expand?: { profile?: unknown } }) => item.expand?.profile)
      .filter(Boolean)
      .map((rec: Record<string, unknown>) => mapProfile(rec))
    const profiles: Profile[] = mappedProfiles.filter((p: Profile | null): p is Profile => p !== null)
    return Response.json(profiles)
  } catch {
    return Response.json([])
  }
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  try {
    const body = await request.json()
    const profileId = body?.profileId ?? body?.profile
    if (!profileId) return Response.json({ error: 'profileId obrigatório' }, { status: 400 })

    const res = await fetch(`${PB_URL}/api/collections/favorites/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user: userId, profile: profileId }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return Response.json({ error: (err as { message?: string }).message || 'Erro ao adicionar' }, { status: res.status })
    }
    const record = await res.json()
    return Response.json(record)
  } catch (e) {
    return Response.json({ error: 'Erro ao adicionar favorito' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const profileId = request.nextUrl.searchParams.get('profileId') ?? request.nextUrl.searchParams.get('profile')
  if (!profileId) return Response.json({ error: 'profileId obrigatório' }, { status: 400 })

  try {
    const filter = `user="${userId}" && profile="${profileId}"`
    const listRes = await fetch(
      `${PB_URL}/api/collections/favorites/records?filter=${encodeURIComponent(filter)}&perPage=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!listRes.ok) return Response.json({ ok: true })
    const list = await listRes.json()
    const recordId = list.items?.[0]?.id
    if (!recordId) return Response.json({ ok: true })

    await fetch(`${PB_URL}/api/collections/favorites/records/${recordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: true })
  }
}
