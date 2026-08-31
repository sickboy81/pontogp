import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { isValidPushSubscription, pushSubscriptionPayload } from '@/lib/push-subscription.mjs'
import { authorizeSession } from '@/lib/authenticated-session.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  const auth = await authorizeSession({ pbUrl: PB_URL, sessionToken: token, getAdminTokenImpl: getAdminToken })
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  const { userId, adminToken } = auth
  const body = await request.json().catch(() => null)
  if (!isValidPushSubscription(body)) return Response.json({ error: 'Inscrição push inválida.' }, { status: 400 })
  const filter = encodeURIComponent(`endpoint = "${body.endpoint.replace(/"/g, '\\"')}"`)
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
  const existing = await fetch(`${PB_URL}/api/collections/push_subscriptions/records?filter=${filter}&perPage=1`, { headers, cache: 'no-store' })
  const items = existing.ok ? ((await existing.json()).items || []) : []
  const payload = pushSubscriptionPayload(body, userId)
  const res = items[0]
    ? await fetch(`${PB_URL}/api/collections/push_subscriptions/records/${items[0].id}`, { method: 'PATCH', headers, body: JSON.stringify(payload) })
    : await fetch(`${PB_URL}/api/collections/push_subscriptions/records`, { method: 'POST', headers, body: JSON.stringify(payload) })
  if (!res.ok) return Response.json({ error: 'Não foi possível guardar a inscrição.' }, { status: 502 })
  return Response.json({ subscribed: true })
}

export async function DELETE(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  const auth = await authorizeSession({ pbUrl: PB_URL, sessionToken: token, getAdminTokenImpl: getAdminToken })
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  const { userId, adminToken } = auth
  const body = await request.json().catch(() => null)
  if (!body?.endpoint || typeof body.endpoint !== 'string') return Response.json({ error: 'Endpoint obrigatório.' }, { status: 400 })
  const filter = encodeURIComponent(`user = "${userId}" && endpoint = "${body.endpoint.replace(/"/g, '\\"')}"`)
  const res = await fetch(`${PB_URL}/api/collections/push_subscriptions/records?filter=${filter}&perPage=1`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
  const item = res.ok ? (await res.json()).items?.[0] : null
  if (item) await fetch(`${PB_URL}/api/collections/push_subscriptions/records/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } })
  return Response.json({ subscribed: false })
}
