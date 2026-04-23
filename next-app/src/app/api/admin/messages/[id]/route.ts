import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { mapMessage } from '@/lib/api/messages'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** PATCH: atualiza mensagem (ex.: marcar lida). Apenas admin. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  if (!id) return Response.json({ error: 'id obrigatório' }, { status: 400 })

  let body: { read?: boolean }
  try {
    body = (await request.json()) as { read?: boolean }
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.read === 'boolean') patch.read = body.read

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: 'Nada para atualizar' }, { status: 400 })
  }

  const adminToken = (await getAdminToken()) || auth.token

  try {
    const patchRes = await fetch(`${PB_URL}/api/collections/messages/records/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(patch),
    })
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao atualizar' },
        { status: patchRes.status }
      )
    }
    const updated = (await patchRes.json()) as Record<string, unknown> & { expand?: Record<string, unknown> }
    const fullRes = await fetch(
      `${PB_URL}/api/collections/messages/records/${id}?expand=sender,recipient`,
      { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' }
    )
    if (fullRes.ok) {
      const full = (await fullRes.json()) as Record<string, unknown> & { expand?: Record<string, unknown> }
      return Response.json(mapMessage(full))
    }
    return Response.json(mapMessage(updated))
  } catch {
    return Response.json({ error: 'Erro ao atualizar mensagem' }, { status: 500 })
  }
}
