import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

const ALLOWED_STATUS = ['active', 'inactive', 'suspended', 'muted', 'archived']

/** PATCH: atualiza perfil (apenas admin). Body: { status }. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  const body = (await request.json()) as { status?: string }
  const status = body?.status?.trim()
  if (!status || !ALLOWED_STATUS.includes(status)) {
    return Response.json(
      { error: `status deve ser um de: ${ALLOWED_STATUS.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(`${PB_URL}/api/collections/profiles/records/${id}`, {
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
  } catch {
    return Response.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
