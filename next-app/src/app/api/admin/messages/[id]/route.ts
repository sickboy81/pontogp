import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const id = request.nextUrl.pathname.split('/').pop() || ''
  const res = await fetch(`${PB_URL}/api/collections/messages/records/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ read: true }),
  })
  if (!res.ok) return Response.json({ error: 'Não foi possível marcar a mensagem como lida.' }, { status: res.status })
  return Response.json({ ok: true })
}
