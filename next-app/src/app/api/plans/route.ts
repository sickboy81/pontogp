import { NextRequest } from 'next/server'
import type { Plan } from '@/lib/types'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'
const PUBLIC_CACHE_CONTROL = 'public, max-age=30, s-maxage=30, stale-while-revalidate=60'
const PRIVATE_CACHE_CONTROL = 'private, no-store'

async function fetchPocketBase(input: string, init: RequestInit = {}, attempts = 2): Promise<Response> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)
    try {
      return await fetch(input, { ...init, signal: controller.signal })
    } catch (error) {
      lastError = error
      if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 250))
    } finally {
      clearTimeout(timeout)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('PocketBase indisponível')
}

function mapPlan(record: Record<string, unknown>): Plan {
  const subDays = record.subscription_days
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
    max_videos: record.max_videos === -1 ? 'unlimited' : (Number(record.max_videos) || 0),
    max_audio: record.max_audio === -1 ? 'unlimited' : (Number(record.max_audio) || 0),
    analytics: !!record.analytics,
    featured: !!record.featured,
    features: Array.isArray(record.features) ? (record.features as string[]) : [],
    target_type: record.target_type as Plan['target_type'],
    highlight_percentage: Number(record.highlight_percentage) || 0,
    subscription_days:
      subDays != null && subDays !== '' ? Math.max(0, Number(subDays)) || undefined : undefined,
  }
}

/** GET: lista planos habilitados. Query: enabledOnly=true (default). */
export async function GET(request: NextRequest) {
  const enabledOnly = request.nextUrl.searchParams.get('enabledOnly') !== 'false'
  if (!enabledOnly && !(await requireAdmin(request))) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }
  try {
    const filter = enabledOnly ? 'enabled = true' : ''
    const url = `${PB_URL}/api/collections/plans/records?perPage=50&sort=price_monthly${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`
    const res = await fetchPocketBase(url, { cache: 'no-store' })
    const cacheControl = enabledOnly ? PUBLIC_CACHE_CONTROL : PRIVATE_CACHE_CONTROL
    if (!res.ok) {
      return Response.json({ error: 'Planos temporariamente indisponíveis.' }, {
        status: 503,
        headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' },
      })
    }
    const data = await res.json()
    const items = (data.items || []) as Record<string, unknown>[]
    const plans = items.map(mapPlan)
    if (enabledOnly && plans.length === 0) {
      return Response.json({ error: 'Planos temporariamente indisponíveis.' }, {
        status: 503,
        headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' },
      })
    }
    return Response.json(plans, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error('[api/plans] PocketBase indisponível', error)
    return Response.json({ error: 'Planos temporariamente indisponíveis.' }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
        'Retry-After': '5',
      },
    })
  }
}
