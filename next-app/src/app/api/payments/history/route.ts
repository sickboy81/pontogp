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
  const { userId, adminToken } = auth
  const filter = `user="${userId.replace(/"/g, '\\"')}"`
  const url = `${PB_URL}/api/collections/payments/records?filter=${encodeURIComponent(filter)}&sort=-created&perPage=50&expand=plan`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
  if (!res.ok) return Response.json({ error: 'Não foi possível carregar pagamentos' }, { status: res.status })
  const data = await res.json()
  return Response.json({ items: data.items || [] })
}
