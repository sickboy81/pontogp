import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { getClientIp } from '@/lib/rate-limit.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  const userId = token ? getUserIdFromToken(token) : null
  const body = await request.json().catch(() => null) as { currentPassword?: string } | null
  if (!token || !userId) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  if (!body?.currentPassword) return Response.json({ error: 'Informe sua senha atual.' }, { status: 400 })
  const accountRes = await fetch(`${PB_URL}/api/collections/users/records/${userId}?fields=id,email`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  const account = accountRes.ok ? await accountRes.json() : null
  if (!account?.email) return Response.json({ error: 'Sessão inválida. Entre novamente.' }, { status: 401 })
  const check = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: account.email, password: body.currentPassword }) })
  if (!check.ok) return Response.json({ error: 'A senha atual está incorreta.' }, { status: 400 })
  // Atualizar a própria senha com o mesmo valor faz o PocketBase renovar tokenKey,
  // invalidando os JWTs de outros dispositivos sem revelar nem alterar a senha.
  const revoke = await fetch(`${PB_URL}/api/collections/users/records/${userId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword: body.currentPassword, password: body.currentPassword, passwordConfirm: body.currentPassword }) })
  if (!revoke.ok) return Response.json({ error: 'Não foi possível encerrar as outras sessões.' }, { status: 502 })
  const adminToken = await getAdminToken()
  if (adminToken) await fetch(`${PB_URL}/api/collections/account_events/records`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ user: userId, type: 'logout_all', ip_address: getClientIp(request.headers), user_agent: request.headers.get('user-agent') || '' }) }).catch(() => undefined)
  return Response.json({ ok: true })
}
