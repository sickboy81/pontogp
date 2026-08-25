import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { getClientIp } from '@/lib/rate-limit.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const allowed = new Set(['password_changed', 'email_change_requested'])
export async function POST(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie')); const userId = token ? getUserIdFromToken(token) : null
  const body = await request.json().catch(() => null) as { type?: string } | null
  if (!userId) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  if (!body?.type || !allowed.has(body.type)) return Response.json({ error: 'Evento inválido.' }, { status: 400 })
  const adminToken = await getAdminToken(); if (!adminToken) return Response.json({ error: 'Serviço indisponível.' }, { status: 503 })
  const result = await fetch(`${PB_URL}/api/collections/account_events/records`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ user: userId, type: body.type, ip_address: getClientIp(request.headers), user_agent: request.headers.get('user-agent') || '' }) })
  return result.ok ? Response.json({ ok: true }) : Response.json({ error: 'Não foi possível registrar o evento.' }, { status: 502 })
}
