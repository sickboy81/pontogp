import { NextRequest } from 'next/server'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'
const CACHE_CONTROL = 'public, max-age=10, s-maxage=15, stale-while-revalidate=30'
const CACHE_TTL_MS = 15_000
let cachedMaintenance: { enabled: boolean; message?: string } | null = null
let cachedMaintenanceAt = 0

/** GET: configuração de manutenção. Público. */
export async function GET(request: NextRequest) {
  const now = Date.now()
  if (cachedMaintenance && now - cachedMaintenanceAt < CACHE_TTL_MS) {
    return Response.json(cachedMaintenance, { headers: { 'Cache-Control': CACHE_CONTROL } })
  }

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "maintenance"')}&perPage=1&fields=value`,
      { cache: 'no-store' }
    )
    if (!res.ok) {
      return Response.json({ enabled: false }, { headers: { 'Cache-Control': CACHE_CONTROL } })
    }
    const data = await res.json()
    const item = data.items?.[0]
    const value = item?.value
    const payload =
      !value || typeof value !== 'object'
        ? { enabled: false }
        : {
      enabled: !!value.enabled,
      message: typeof value.message === 'string' ? value.message : 'Site em manutenção. Voltaremos em breve!',
          }
    cachedMaintenance = payload
    cachedMaintenanceAt = now
    return Response.json(payload, { headers: { 'Cache-Control': CACHE_CONTROL } })
  } catch {
    return Response.json({ enabled: false }, { headers: { 'Cache-Control': CACHE_CONTROL } })
  }
}
