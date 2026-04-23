import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

export type PlanExpiration = { contact_days: number; search_days: number }
export type ExpirationDurations = Record<string, PlanExpiration>

/** GET: lê durações de expiração por plano (settings key "expiration_durations"). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const token = await getAdminToken()
  if (!token) return Response.json({ durations: {} })

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "expiration_durations"')}&perPage=1&fields=id,value`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!res.ok) return Response.json({ durations: {} })
    const data = await res.json()
    const value = data.items?.[0]?.value as ExpirationDurations | undefined
    return Response.json({ durations: value && typeof value === 'object' ? value : {} })
  } catch {
    return Response.json({ durations: {} })
  }
}

/** PATCH: atualiza durações. Body: { durations: Record<slug, { contact_days, search_days }> } */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const token = await getAdminToken()
  if (!token) return Response.json({ error: 'Serviço indisponível' }, { status: 503 })

  const body = (await request.json()) as { durations?: ExpirationDurations }
  const durations = body.durations && typeof body.durations === 'object' ? body.durations : {}

  try {
    const listRes = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "expiration_durations"')}&perPage=1&fields=id`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!listRes.ok) throw new Error('Erro ao buscar')
    const listData = await listRes.json()
    const existing = listData.items?.[0] as { id?: string } | undefined

    if (existing?.id) {
      const res = await fetch(
        `${PB_URL}/api/collections/settings/records/${existing.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ value: durations }),
        }
      )
      if (!res.ok) throw new Error('Erro ao atualizar')
    } else {
      const res = await fetch(`${PB_URL}/api/collections/settings/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: 'expiration_durations', value: durations }),
      })
      if (!res.ok) throw new Error('Erro ao criar')
    }
    return Response.json({ ok: true, durations })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Erro ao salvar' },
      { status: 500 }
    )
  }
}
