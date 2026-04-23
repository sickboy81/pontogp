import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { mapMessage } from '@/lib/api/messages'
import type { Message } from '@/lib/types'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: lista mensagens do sistema (apenas admin). Query: page, perPage, read=all|true|false. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 30))
  const readFilter = request.nextUrl.searchParams.get('read') // all, true, false

  let filter = ''
  if (readFilter === 'true') filter = 'read = true'
  else if (readFilter === 'false') filter = 'read = false'

  try {
    const url = `${PB_URL}/api/collections/messages/records?page=${page}&perPage=${perPage}&sort=-created_at${filter ? `&filter=${encodeURIComponent(filter)}` : ''}&expand=sender,recipient`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: 'no-store',
    })
    if (!res.ok) return Response.json({ items: [], totalItems: 0 })
    const data = await res.json()
    const items = ((data.items || []) as Record<string, unknown>[]).map((r) => mapMessage(r)) as Message[]
    return Response.json({
      items,
      totalItems: data.totalItems ?? items.length,
      page,
      perPage,
    })
  } catch {
    return Response.json({ items: [], totalItems: 0 })
  }
}
