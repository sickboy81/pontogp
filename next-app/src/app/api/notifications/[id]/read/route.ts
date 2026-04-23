import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** POST: marca notificação como lida. Só o destinatário pode. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const { id } = await params
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  try {
    const getRes = await fetch(
      `${PB_URL}/api/collections/notifications/records/${id}?fields=id,recipient`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!getRes.ok) return Response.json({ error: 'Notificação não encontrada' }, { status: 404 })
    const rec = (await getRes.json()) as { recipient?: string }
    if (rec.recipient !== userId) return Response.json({ error: 'Não autorizado' }, { status: 403 })

    const res = await fetch(`${PB_URL}/api/collections/notifications/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ read: true }),
    })
    if (!res.ok) return Response.json({ error: 'Erro ao marcar como lida' }, { status: res.status })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Erro ao processar' }, { status: 500 })
  }
}
