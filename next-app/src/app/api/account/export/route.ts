import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { getClientIp } from '@/lib/rate-limit.mjs'
import { authorizeSession } from '@/lib/authenticated-session.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'
const q = (field: string, id: string) => encodeURIComponent(`${field} = "${id.replace(/"/g, '\\"')}"`)

export async function GET(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  const auth = await authorizeSession({ pbUrl: PB_URL, sessionToken: token, getAdminTokenImpl: getAdminToken })
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  const { userId, adminToken } = auth
  const headers = { Authorization: `Bearer ${adminToken}` }
  const one = (collection: string, field: string) => fetch(`${PB_URL}/api/collections/${collection}/records?filter=${q(field, userId)}&perPage=500`, { headers, cache: 'no-store' }).then(async r => r.ok ? (await r.json()).items || [] : [])
  const [userRes, profiles, payments, favorites, notifications, sentMessages, receivedMessages] = await Promise.all([
    fetch(`${PB_URL}/api/collections/users/records/${userId}?fields=id,email,name,full_name,display_name,city,state,age,bio,role,verified,created,updated`, { headers, cache: 'no-store' }),
    one('profiles', 'user'), one('payments', 'user'), one('favorites', 'user'), one('notifications', 'recipient'), one('messages', 'sender'), one('messages', 'recipient'),
  ])
  if (!userRes.ok) return Response.json({ error: 'Sessão inválida.' }, { status: 401 })
  const user = await userRes.json()
  await fetch(`${PB_URL}/api/collections/account_events/records`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ user: userId, type: 'data_export', ip_address: getClientIp(request.headers), user_agent: request.headers.get('user-agent') || '' }) }).catch(() => undefined)
  const body = JSON.stringify({ exported_at: new Date().toISOString(), user, profiles, payments, favorites, notifications, messages: [...sentMessages, ...receivedMessages] }, null, 2)
  return new Response(body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="cerejavip-dados-${new Date().toISOString().slice(0, 10)}.json"`, 'Cache-Control': 'no-store' } })
}
