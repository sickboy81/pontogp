/**
 * Datas de busca / contato ao ativar ou renovar plano.
 * Regra alinhada ao webhook PIX (sem cupom: usa settings, subscription_days e slug).
 */

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

function isPocketBaseId(s: string): boolean {
  return /^[a-z0-9]{15}$/i.test(s)
}

function toPBDateString(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

type PlanJson = { id?: string; slug?: string; subscription_days?: number }

/** Resolve referência (id 15 chars ou slug) para registro de plano. */
async function resolvePlanRecord(planRef: string, adminToken: string): Promise<PlanJson | null> {
  const authHeader = { Authorization: `Bearer ${adminToken}` }
  if (isPocketBaseId(planRef)) {
    const res = await fetch(`${PB_URL}/api/collections/plans/records/${planRef}`, {
      headers: authHeader,
      cache: 'no-store',
    })
    if (res.ok) {
      return (await res.json()) as PlanJson
    }
  }
  const q = planRef.replace(/"/g, '\\"')
  const res = await fetch(
    `${PB_URL}/api/collections/plans/records?filter=${encodeURIComponent(`slug = "${q.toLowerCase()}"`)}&perPage=1`,
    { headers: authHeader, cache: 'no-store' }
  )
  if (!res.ok) return null
  const data = (await res.json()) as { items?: PlanJson[] }
  return data.items?.[0] ?? null
}

/**
 * Gera o payload (plan id + expirações) a partir de agora, como no pagamento concluído
 * (sem lógica de cupom; mesmo critério de duração do webhook quando não há cupom).
 */
export async function buildProfilePlanRenewalFromPlanRef(
  planRef: string,
  adminToken: string
): Promise<{ plan: string; search_expires_at: string; contact_expires_at: string } | null> {
  const planJson = await resolvePlanRecord(planRef, adminToken)
  if (!planJson?.id) return null

  const planSlug = planJson.slug
  let searchDays = 30
  let contactDays = 30

  const authHeader = { Authorization: `Bearer ${adminToken}` }
  const settingsRes = await fetch(
    `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "expiration_durations"')}&perPage=1&fields=value`,
    { headers: authHeader, cache: 'no-store' }
  )
  if (settingsRes.ok) {
    const setData = (await settingsRes.json()) as {
      items?: { value?: Record<string, { contact_days?: number; search_days?: number }> }[]
    }
    const durations = setData.items?.[0]?.value
    const bySlug = planSlug && durations?.[planSlug]
    if (bySlug && typeof bySlug.contact_days === 'number' && typeof bySlug.search_days === 'number') {
      contactDays = Math.max(1, bySlug.contact_days)
      searchDays = Math.max(1, bySlug.search_days)
    } else if (planJson.slug === 'gratis') {
      searchDays = 7
      contactDays = 7
    } else if (typeof planJson.subscription_days === 'number' && planJson.subscription_days > 0) {
      searchDays = planJson.subscription_days
      contactDays = planJson.subscription_days
    }
  } else {
    if (planJson.slug === 'gratis') {
      searchDays = 7
      contactDays = 7
    } else if (typeof planJson.subscription_days === 'number' && planJson.subscription_days > 0) {
      searchDays = planJson.subscription_days
      contactDays = planJson.subscription_days
    }
  }

  const now = new Date()
  const searchExpires = new Date(now)
  searchExpires.setDate(searchExpires.getDate() + searchDays)
  const contactExpires = new Date(now)
  contactExpires.setDate(contactExpires.getDate() + contactDays)

  return {
    plan: planJson.id,
    search_expires_at: toPBDateString(searchExpires),
    contact_expires_at: toPBDateString(contactExpires),
  }
}
