import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getTokenPayload } from '@/lib/auth-cookie'
import { getClientIp } from '@/lib/rate-limit.mjs'
import { enforceUserRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  const userId = token ? getTokenPayload(token)?.id : null
  if (!token || !userId) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const limited = enforceUserRateLimit(request, 'login-alert', userId, RATE_LIMIT_POLICIES.write)
  if (limited) return limited

  try {
    const userResponse = await fetch(`${PB_URL}/api/collections/users/records/${encodeURIComponent(userId)}?fields=id,status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!userResponse.ok) return Response.json({ error: 'Sessão inválida.' }, { status: 401 })
    const user = await userResponse.json() as { status?: string }
    if (user.status && user.status !== 'active') return Response.json({ error: 'Conta indisponível.' }, { status: 403 })

    const adminToken = await getAdminToken()
    if (adminToken) await fetch(`${PB_URL}/api/collections/account_events/records`, {
      method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userId, type: 'login', ip_address: getClientIp(request.headers), user_agent: request.headers.get('user-agent') || '' }),
    }).catch(() => undefined)
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[login-event] Falha ao registrar o acesso:', error instanceof Error ? error.message : 'erro desconhecido')
    return Response.json({ error: 'Não foi possível registrar o acesso.' }, { status: 502 })
  }
}
