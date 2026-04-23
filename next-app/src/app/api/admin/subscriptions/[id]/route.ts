import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

async function getEffectiveToken(userToken: string): Promise<string> {
  const adminToken = await getAdminToken()
  return adminToken || userToken
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  try {
    const body = (await request.json()) as Record<string, unknown>
    const token = await getEffectiveToken(auth.token)
    const res = await fetch(`${PB_URL}/api/collections/subscriptions/records/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return Response.json(
        { error: (json as { message?: string }).message || 'Erro ao atualizar assinatura' },
        { status: res.status }
      )
    }
    return Response.json(json)
  } catch {
    return Response.json({ error: 'Erro ao atualizar assinatura' }, { status: 500 })
  }
}
