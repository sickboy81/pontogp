import { NextRequest } from 'next/server'
import type { Plan } from '@/lib/types'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function mapPlan(record: Record<string, unknown>): Plan {
  return {
    id: record.id as string,
    name: (record.name as string) || '',
    slug: (record.slug as string) || '',
    enabled: !!(record.enabled as boolean),
    highlight_color: record.highlight_color as string | undefined,
    price_weekly: Number(record.price_weekly) || 0,
    price_monthly: Number(record.price_monthly) || Number(record.price) || 0,
    daily_bumps: Number(record.daily_bumps) || 0,
    max_photos: record.max_photos === -1 ? 'unlimited' : (Number(record.max_photos) || 0),
    features: Array.isArray(record.features) ? (record.features as string[]) : [],
    target_type: record.target_type as Plan['target_type'],
    highlight_percentage: Number(record.highlight_percentage) || 0,
  }
}

/** GET: lista planos habilitados. Query: enabledOnly=true (default). */
export async function GET(request: NextRequest) {
  const enabledOnly = request.nextUrl.searchParams.get('enabledOnly') !== 'false'
  try {
    const filter = enabledOnly ? 'enabled = true' : ''
    const url = `${PB_URL}/api/collections/plans/records?perPage=50&sort=price_monthly${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return Response.json([])
    const data = await res.json()
    const items = (data.items || []) as Record<string, unknown>[]
    const plans = items.map(mapPlan)
    return Response.json(plans)
  } catch {
    return Response.json([])
  }
}
