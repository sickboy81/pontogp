import { NextRequest } from 'next/server'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: configuração de manutenção. Público. */
export async function GET(request: NextRequest) {
  try {
    const res = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "maintenance"')}&perPage=1&fields=value`,
      { cache: 'no-store', next: { revalidate: 0 } }
    )
    if (!res.ok) return Response.json({ enabled: false })
    const data = await res.json()
    const item = data.items?.[0]
    const value = item?.value
    if (!value || typeof value !== 'object') return Response.json({ enabled: false })
    return Response.json({
      enabled: !!value.enabled,
      message: typeof value.message === 'string' ? value.message : 'Site em manutenção. Voltaremos em breve!',
    })
  } catch {
    return Response.json({ enabled: false })
  }
}
