import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import {
  buildInternalMessagesDisabledPayload,
  DEFAULT_PUBLIC_INTERNAL_MESSAGES_SETTINGS,
  getPublicInternalMessagesSettings,
  INTERNAL_MESSAGES_SETTINGS_KEY,
} from '@/lib/internal-messages-settings.mjs'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { mapMessage } from '@/lib/api/messages'
import { enforceUserRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'
import type { Message } from '@/lib/types'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

async function loadInternalMessagesSettings() {
  try {
    const res = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent(`key = "${INTERNAL_MESSAGES_SETTINGS_KEY}"`)}&sort=${encodeURIComponent('created,id')}&perPage=50&fields=id,created,value`,
      { cache: 'no-store' }
    )
    if (!res.ok) return DEFAULT_PUBLIC_INTERNAL_MESSAGES_SETTINGS

    const data = await res.json()
    return getPublicInternalMessagesSettings(data.items)
  } catch {
    return DEFAULT_PUBLIC_INTERNAL_MESSAGES_SETTINGS
  }
}

/** GET: lista todas as mensagens do usuário (para montar lista de conversas). */
export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  try {
    const filter = `sender = "${userId}" || recipient = "${userId}"`
    const res = await fetch(
      `${PB_URL}/api/collections/messages/records?perPage=500&expand=sender,recipient&sort=-created_at&filter=${encodeURIComponent(filter)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return Response.json([])
    const data = await res.json()
    const items = (data.items || []) as Record<string, unknown>[]
    const messages: Message[] = items.map((rec) => mapMessage(rec))
    return Response.json(messages)
  } catch {
    return Response.json([])
  }
}

/** Ordena dois IDs para chave message_blocks (user_a <= user_b). */
function blockKey(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a]
}

/** POST: envia uma mensagem. Body: { recipient_id, content }. Verifica message_blocks; cria notificação para o destinatário. */
export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })
  const limited = enforceUserRateLimit(request, 'message-send', userId, RATE_LIMIT_POLICIES.write)
  if (limited) return limited

  try {
    const messagesSettings = await loadInternalMessagesSettings()
    if (!messagesSettings.enabled) {
      return Response.json(buildInternalMessagesDisabledPayload(messagesSettings), { status: 503 })
    }

    const body = await request.json()
    const recipientId = body?.recipient_id ?? body?.recipient
    const content = (body?.content ?? '').trim()
    if (!recipientId || !content) {
      return Response.json({ error: 'recipient_id e content obrigatórios' }, { status: 400 })
    }

    const [userA, userB] = blockKey(userId, recipientId)
    const blockFilter = `user_a = "${userA}" && user_b = "${userB}" && blocked = true`
    const blockRes = await fetch(
      `${PB_URL}/api/collections/message_blocks/records?perPage=1&filter=${encodeURIComponent(blockFilter)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (blockRes.ok) {
      const blockData = await blockRes.json()
      if (blockData.items?.length > 0) {
        return Response.json(
          { error: 'Esta conversa está bloqueada. Não é possível enviar mensagens.' },
          { status: 403 }
        )
      }
    }

    const res = await fetch(`${PB_URL}/api/collections/messages/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sender: userId,
        recipient: recipientId,
        content,
        read: false,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao enviar' },
        { status: res.status }
      )
    }
    const record = (await res.json()) as Record<string, unknown>

    const adminToken = await getAdminToken()
    if (adminToken) {
      try {
        await fetch(`${PB_URL}/api/collections/notifications/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({
            recipient: recipientId,
            title: 'Nova mensagem',
            message: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
            type: 'message',
            read: false,
            link: '/mensagens',
          }),
        })
      } catch {
        // ignore
      }
    }

    // re-fetch with expand to return full Message
    const getRes = await fetch(
      `${PB_URL}/api/collections/messages/records/${record.id}?expand=sender,recipient`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (getRes.ok) {
      const full = (await getRes.json()) as Record<string, unknown>
      return Response.json(mapMessage(full))
    }
    return Response.json(mapMessage(record))
  } catch (e) {
    return Response.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
