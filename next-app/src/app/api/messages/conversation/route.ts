import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader } from '@/lib/auth-cookie'
import { mapMessage } from '@/lib/api/messages'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { authorizeSession } from '@/lib/authenticated-session.mjs'
import { canMessageAccountRoles } from '@/lib/message-input.mjs'
import type { Message } from '@/lib/types'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** GET: conversa entre o usuário logado e otherUserId. Query: otherUserId= */
export async function GET(request: NextRequest) {
  const token = getToken(request)
  const auth = await authorizeSession({ pbUrl: PB_URL, sessionToken: token, getAdminTokenImpl: getAdminToken })
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  const { userId, adminToken } = auth

  const otherUserId = request.nextUrl.searchParams.get('otherUserId')
  if (!otherUserId) return Response.json({ error: 'otherUserId obrigatório' }, { status: 400 })

  try {
    const otherRes = await fetch(
      `${PB_URL}/api/collections/users/records/${encodeURIComponent(otherUserId)}?fields=id,role`,
      { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' },
    )
    const other = otherRes.ok ? await otherRes.json() as { role?: string } : null
    if (!other || !canMessageAccountRoles(auth.user.role, other.role)) {
      return Response.json({ error: 'Esta conversa não é permitida para estes tipos de conta.' }, { status: 403 })
    }
    const filter = `(sender = "${userId}" && recipient = "${otherUserId}") || (sender = "${otherUserId}" && recipient = "${userId}")`
    const res = await fetch(
      `${PB_URL}/api/collections/messages/records?perPage=200&expand=sender,recipient&filter=${encodeURIComponent(filter)}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    if (!res.ok) return Response.json({ error: 'Não foi possível carregar esta conversa.' }, { status: 502 })
    const data = await res.json()
    const items = (data.items || []) as Record<string, unknown>[]
    const messages: Message[] = items.map((rec) => mapMessage(rec))
    return Response.json(messages)
  } catch {
    return Response.json([])
  }
}
