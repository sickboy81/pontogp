import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { mapMessage } from '@/lib/api/messages'
import type { Message } from '@/lib/types'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** GET: conversa entre o usuário logado e otherUserId. Query: otherUserId= */
export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const otherUserId = request.nextUrl.searchParams.get('otherUserId')
  if (!otherUserId) return Response.json({ error: 'otherUserId obrigatório' }, { status: 400 })

  try {
    const filter = `(sender = "${userId}" && recipient = "${otherUserId}") || (sender = "${otherUserId}" && recipient = "${userId}")`
    const res = await fetch(
      `${PB_URL}/api/collections/messages/records?perPage=200&expand=sender,recipient&sort=created&filter=${encodeURIComponent(filter)}`,
      { headers: { Authorization: `Bearer ${token}` } }
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
