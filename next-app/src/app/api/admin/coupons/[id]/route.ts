import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { COUPONS_COLLECTION } from '@/lib/coupons-collection'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** PATCH: atualiza cupom (apenas admin). Body: { code?, plan_id?, duration_days?, max_uses?, expires_at?, active? } */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const token = await getAdminToken()
  if (!token) return Response.json({ error: 'Serviço indisponível' }, { status: 503 })

  const { id } = await params
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  try {
    const body = (await request.json()) as {
      code?: string
      plan_id?: string
      duration_days?: number
      max_uses?: number
      expires_at?: string | null
      active?: boolean
    }
    const record: Record<string, unknown> = {}
    if (body.code !== undefined) {
      const code = String(body.code).trim().toUpperCase().replace(/\s/g, '')
      if (code.length < 3) return Response.json({ error: 'Código inválido' }, { status: 400 })
      record.code = code
    }
    if (body.plan_id !== undefined) record.plan_id = body.plan_id
    if (body.duration_days !== undefined) record.duration_days = Math.max(1, Math.min(365, Number(body.duration_days) || 30))
    if (body.max_uses !== undefined) record.max_uses = body.max_uses == null ? null : Math.max(0, Number(body.max_uses))
    if (body.expires_at !== undefined) record.expires_at = body.expires_at || ''
    if (body.active !== undefined) record.active = body.active

    if (Object.keys(record).length === 0) {
      return Response.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const res = await fetch(`${PB_URL}/api/collections/${COUPONS_COLLECTION}/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(record),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = (data as { message?: string }).message || (data as { error?: string }).error || 'Erro ao atualizar'
      return Response.json({ error: msg }, { status: res.status >= 400 ? res.status : 500 })
    }
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Erro ao atualizar cupom' }, { status: 500 })
  }
}
