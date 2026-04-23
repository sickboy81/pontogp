import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { parseExpirationDurationsValue } from '@/lib/parse-expiration-settings'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

export type PlanExpiration = { contact_days: number; search_days: number }
export type ExpirationDurations = Record<string, PlanExpiration | Partial<PlanExpiration>>

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
    const value = data.items?.[0]?.value
    const durations = parseExpirationDurationsValue(value)
    return Response.json({ durations })
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
  const raw = body.durations && typeof body.durations === 'object' ? body.durations : {}
  /** Normaliza: só inteiros >= 1; chaves vazias são omitidas. */
  const durations: ExpirationDurations = {}
  for (const [slug, v] of Object.entries(raw)) {
    if (!v || typeof v !== 'object') continue
    const c = (v as PlanExpiration).contact_days
    const s = (v as PlanExpiration).search_days
    const entry: Partial<PlanExpiration> = {}
    if (typeof c === 'number' && c >= 1 && c <= 365) entry.contact_days = Math.floor(c)
    if (typeof s === 'number' && s >= 1 && s <= 365) entry.search_days = Math.floor(s)
    if (Object.keys(entry).length) durations[slug] = entry as PlanExpiration
  }

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
