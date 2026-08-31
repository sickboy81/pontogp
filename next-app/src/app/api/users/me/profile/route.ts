import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { authorizeSession } from '@/lib/authenticated-session.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  const auth = await authorizeSession({ pbUrl: PB_URL, sessionToken: token, getAdminTokenImpl: getAdminToken })
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  const res = await fetch(`${PB_URL}/api/collections/users/records/${auth.userId}?fields=id,role,city,state,age,bio`, { headers: { Authorization: `Bearer ${auth.adminToken}` }, cache: 'no-store' })
  if (!res.ok) return Response.json({ error: 'Não foi possível carregar seu perfil.' }, { status: 502 })
  const user = await res.json() as { role?: string; city?: string; state?: string; age?: number; bio?: string }
  if (user.role !== 'user') return Response.json({ error: 'Este perfil é exclusivo para contas de usuário.' }, { status: 403 })
  return Response.json({ city: user.city || '', state: user.state || '', age: user.age || null, bio: user.bio || '' })
}

export async function PATCH(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  const auth = await authorizeSession({ pbUrl: PB_URL, sessionToken: token, getAdminTokenImpl: getAdminToken })
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  if (auth.user.role !== 'user') return Response.json({ error: 'Este perfil é exclusivo para contas de usuário.' }, { status: 403 })
  const body = await request.json().catch(() => null) as { city?: unknown; state?: unknown; age?: unknown; bio?: unknown } | null
  const city = typeof body?.city === 'string' ? body.city.trim().slice(0, 100) : ''
  const state = typeof body?.state === 'string' ? body.state.trim().toUpperCase().slice(0, 2) : ''
  const bio = typeof body?.bio === 'string' ? body.bio.trim().slice(0, 300) : ''
  const age = body?.age === '' || body?.age == null ? null : Number(body.age)
  if ((age !== null && (!Number.isInteger(age) || age < 18 || age > 100)) || (state && !/^[A-Z]{2}$/.test(state))) return Response.json({ error: 'Confira idade e estado. A idade deve estar entre 18 e 100 anos.' }, { status: 400 })
  const res = await fetch(`${PB_URL}/api/collections/users/records/${auth.userId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${auth.adminToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ city: city || null, state: state || null, age, bio: bio || null }) })
  if (!res.ok) return Response.json({ error: 'Não foi possível salvar seu perfil.' }, { status: 502 })
  return Response.json({ city, state, age, bio })
}
