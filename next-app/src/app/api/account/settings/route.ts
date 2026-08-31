import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { normalizeNotificationPreferences, selectCurrentPlan } from '@/lib/account-settings.mjs'
import { authorizeSession } from '@/lib/authenticated-session.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

function filter(field: string, userId: string) { return encodeURIComponent(`${field} = "${userId.replace(/"/g, '\\"')}"`) }

async function getContext(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  return authorizeSession({ pbUrl: PB_URL, sessionToken: token, getAdminTokenImpl: getAdminToken })
}

export async function GET(request: NextRequest) {
  const auth = await getContext(request)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  const { userId, adminToken } = auth
  const headers = { Authorization: `Bearer ${adminToken}` }
  const [profilesRes, paymentsRes, preferencesRes, eventsRes, pushRes] = await Promise.all([
    fetch(`${PB_URL}/api/collections/profiles/records?filter=${filter('user', userId)}&perPage=1&fields=id,plan,search_expires_at,contact_expires_at,status`, { headers, cache: 'no-store' }),
    fetch(`${PB_URL}/api/collections/payments/records?filter=${filter('user', userId)}&perPage=50&sort=-created&fields=plan,status,amount,expires_at,created`, { headers, cache: 'no-store' }),
    fetch(`${PB_URL}/api/collections/account_preferences/records?filter=${filter('user', userId)}&perPage=1`, { headers, cache: 'no-store' }),
    fetch(`${PB_URL}/api/collections/account_events/records?filter=${filter('user', userId)}&perPage=10&sort=-created&fields=type,ip_address,user_agent,created`, { headers, cache: 'no-store' }),
    fetch(`${PB_URL}/api/collections/push_subscriptions/records?filter=${filter('user', userId)}&perPage=1`, { headers, cache: 'no-store' }),
  ])
  const read = async (response: Response) => response.ok ? response.json() : { items: [] }
  const [profiles, payments, preferences, events, pushes] = await Promise.all([read(profilesRes), read(paymentsRes), read(preferencesRes), read(eventsRes), read(pushRes)])
  const profile = profiles.items?.[0] || null
  return Response.json({ profile, plan: selectCurrentPlan(payments.items || []), preferences: normalizeNotificationPreferences(preferences.items?.[0]), preferencesId: preferences.items?.[0]?.id || null, events: events.items || [], pushEnabled: Boolean(pushes.items?.length) })
}

export async function PATCH(request: NextRequest) {
  const auth = await getContext(request)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  const { userId, adminToken } = auth
  const body = await request.json().catch(() => null)
  const preferences = normalizeNotificationPreferences(body || {})
  const headers = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  const existing = await fetch(`${PB_URL}/api/collections/account_preferences/records?filter=${filter('user', userId)}&perPage=1`, { headers, cache: 'no-store' })
  const items = existing.ok ? (await existing.json()).items || [] : []
  const url = items[0] ? `${PB_URL}/api/collections/account_preferences/records/${items[0].id}` : `${PB_URL}/api/collections/account_preferences/records`
  const response = await fetch(url, { method: items[0] ? 'PATCH' : 'POST', headers, body: JSON.stringify({ user: userId, ...preferences }) })
  if (!response.ok) return Response.json({ error: 'Não foi possível salvar suas preferências.' }, { status: 502 })
  return Response.json({ preferences })
}
