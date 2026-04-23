import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** PATCH: atualiza denúncia (apenas admin). Body: { status } */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  try {
    const body = (await request.json()) as { status?: string }
    const status = body?.status?.trim()
    if (!status) return Response.json({ error: 'status obrigatório' }, { status: 400 })
    const allowed = ['pending', 'reviewed', 'resolved']
    if (!allowed.includes(status)) {
      return Response.json({ error: 'status inválido' }, { status: 400 })
    }

    const res = await fetch(`${PB_URL}/api/collections/reports/records/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao atualizar' },
        { status: res.status }
      )
    }
    const updated = await res.json()
    return Response.json(updated)
  } catch (e) {
    return Response.json({ error: 'Erro ao atualizar denúncia' }, { status: 500 })
  }
}

/** DELETE: remove denúncia (apenas admin). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(_request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  try {
    const res = await fetch(`${PB_URL}/api/collections/reports/records/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    if (!res.ok) return Response.json({ error: 'Erro ao excluir' }, { status: res.status })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: 'Erro ao excluir denúncia' }, { status: 500 })
  }
}
