import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie')); const id = token ? getUserIdFromToken(token) : null; const admin = await getAdminToken()
  if (!id || !admin) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const res = await fetch(`${PB_URL}/api/collections/users/records/${id}?fields=id,city,state,age,bio`, { headers: { Authorization: `Bearer ${admin}` }, cache: 'no-store' })
  return res.ok ? Response.json(await res.json()) : Response.json({ error: 'Não foi possível carregar seu perfil.' }, { status: 502 })
}

export async function PATCH(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie')); const id = token ? getUserIdFromToken(token) : null; const admin = await getAdminToken()
  if (!id || !admin) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await request.json().catch(() => null) as { city?: unknown; state?: unknown; age?: unknown; bio?: unknown } | null
  const city = typeof body?.city === 'string' ? body.city.trim().slice(0, 100) : ''
  const state = typeof body?.state === 'string' ? body.state.trim().toUpperCase().slice(0, 2) : ''
  const bio = typeof body?.bio === 'string' ? body.bio.trim().slice(0, 300) : ''
  const age = body?.age === '' || body?.age == null ? null : Number(body.age)
  if ((age !== null && (!Number.isInteger(age) || age < 18 || age > 100)) || (state && !/^[A-Z]{2}$/.test(state))) return Response.json({ error: 'Confira idade e estado. A idade deve estar entre 18 e 100 anos.' }, { status: 400 })
  const res = await fetch(`${PB_URL}/api/collections/users/records/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${admin}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ city: city || null, state: state || null, age, bio: bio || null }) })
  if (!res.ok) return Response.json({ error: 'Não foi possível salvar seu perfil.' }, { status: 502 })
  return Response.json({ city, state, age, bio })
}
