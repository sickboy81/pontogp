import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import {
  INTERNAL_MESSAGES_SETTINGS_KEY,
  parseInternalMessagesSettings,
} from '@/lib/internal-messages-settings.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: lê configuração global das mensagens internas. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent(`key = "${INTERNAL_MESSAGES_SETTINGS_KEY}"`)}&perPage=1&fields=id,value`,
      { headers: { Authorization: `Bearer ${auth.token}` }, cache: 'no-store' },
    )
    if (!res.ok) return Response.json(parseInternalMessagesSettings(null))

    const data = await res.json()
    return Response.json(parseInternalMessagesSettings(data.items?.[0]?.value))
  } catch {
    return Response.json(parseInternalMessagesSettings(null))
  }
}

/** PATCH: atualiza configuração global das mensagens internas. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const payload = parseInternalMessagesSettings(body)

    const listRes = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent(`key = "${INTERNAL_MESSAGES_SETTINGS_KEY}"`)}&perPage=1&fields=id`,
      { headers: { Authorization: `Bearer ${auth.token}` }, cache: 'no-store' },
    )
    if (!listRes.ok) throw new Error('Erro ao buscar configuração')

    const listData = await listRes.json()
    const existing = listData.items?.[0] as { id?: string } | undefined

    if (existing?.id) {
      const res = await fetch(`${PB_URL}/api/collections/settings/records/${existing.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ value: payload }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar configuração')
    } else {
      const res = await fetch(`${PB_URL}/api/collections/settings/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ key: INTERNAL_MESSAGES_SETTINGS_KEY, value: payload }),
      })
      if (!res.ok) throw new Error('Erro ao criar configuração')
    }

    return Response.json({ ok: true, ...payload })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erro ao salvar' },
      { status: 500 },
    )
  }
}
