import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import {
  parseExpirationDurationsValue,
  parseProfileVisibilityPolicy,
  type ProfileVisibilityPolicy,
} from '@/lib/parse-expiration-settings'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

export type PlanExpiration = { contact_days: number; search_days: number }
export type ExpirationDurations = Record<string, PlanExpiration | Partial<PlanExpiration>>
const VISIBILITY_POLICY_KEY = 'profile_visibility_policy'

/** GET: lê durações de expiração por plano e política de visibilidade pós-vencimento. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const token = await getAdminToken()
  if (!token) return Response.json({ durations: {} })

  try {
    const [durRes, visRes] = await Promise.all([
      fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "expiration_durations"')}&perPage=1&fields=id,value`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
      ),
      fetch(
        `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent(`key = "${VISIBILITY_POLICY_KEY}"`)}&perPage=1&fields=id,value`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
      ),
    ])
    const durData = durRes.ok ? await durRes.json() : { items: [] }
    const visData = visRes.ok ? await visRes.json() : { items: [] }
    const durations = parseExpirationDurationsValue(durData.items?.[0]?.value)
    const visibility_policy = parseProfileVisibilityPolicy(visData.items?.[0]?.value)
    return Response.json({ durations, visibility_policy })
  } catch {
    return Response.json({
      durations: {},
      visibility_policy: parseProfileVisibilityPolicy(null),
    })
  }
}

/** PATCH: atualiza durações e política. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const token = await getAdminToken()
  if (!token) return Response.json({ error: 'Serviço indisponível' }, { status: 503 })

  const body = (await request.json()) as {
    durations?: ExpirationDurations
    visibility_policy?: Partial<ProfileVisibilityPolicy>
  }
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
  const visibility_policy = parseProfileVisibilityPolicy(body.visibility_policy ?? null)

  try {
    const [listRes, visListRes] = await Promise.all([
      fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "expiration_durations"')}&perPage=1&fields=id`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
      ),
      fetch(
        `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent(`key = "${VISIBILITY_POLICY_KEY}"`)}&perPage=1&fields=id`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
      ),
    ])
    if (!listRes.ok) throw new Error('Erro ao buscar')
    const listData = await listRes.json()
    const existing = listData.items?.[0] as { id?: string } | undefined
    const visListData = visListRes.ok ? await visListRes.json() : { items: [] }
    const visExisting = visListData.items?.[0] as { id?: string } | undefined

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
    if (visExisting?.id) {
      const res = await fetch(
        `${PB_URL}/api/collections/settings/records/${visExisting.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ value: visibility_policy }),
        }
      )
      if (!res.ok) throw new Error('Erro ao atualizar política de visibilidade')
    } else {
      const res = await fetch(`${PB_URL}/api/collections/settings/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: VISIBILITY_POLICY_KEY, value: visibility_policy }),
      })
      if (!res.ok) throw new Error('Erro ao criar política de visibilidade')
    }
    return Response.json({ ok: true, durations, visibility_policy })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Erro ao salvar' },
      { status: 500 }
    )
  }
}
