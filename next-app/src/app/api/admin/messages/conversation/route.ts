import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { mapMessage } from '@/lib/api/messages'
import type { Message } from '@/lib/types'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/**
 * GET: todas as mensagens entre dois utilizadores (ordem crescente por data). Apenas admin.
 * Só leitura — não altera `read` nem notifica ninguém.
 * Query: userA, userB (ids PocketBase, obrigatórios)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const a = request.nextUrl.searchParams.get('userA') || ''
  const b = request.nextUrl.searchParams.get('userB') || ''
  if (!a || !b || a === b) {
    return Response.json({ error: 'userA e userB obrigatórios e distintos' }, { status: 400 })
  }

  const perPage = Math.min(500, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 500))
  const filter = `((sender = "${a}" && recipient = "${b}") || (sender = "${b}" && recipient = "${a}"))`

  try {
    const url = `${PB_URL}/api/collections/messages/records?perPage=${perPage}&page=1&filter=${encodeURIComponent(
      filter
    )}&sort=created&expand=sender,recipient`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      return Response.json({ error: 'Erro ao carregar conversa' }, { status: res.status })
    }
    const data = await res.json()
    const items = ((data.items || []) as Record<string, unknown>[]).map((r) => mapMessage(r)) as Message[]
    return Response.json({ items, total: items.length })
  } catch {
    return Response.json({ error: 'Erro ao carregar conversa' }, { status: 500 })
  }
}
