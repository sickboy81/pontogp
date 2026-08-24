import { createHash } from 'node:crypto'
import { NextRequest } from 'next/server'
import { getClientIp } from '@/lib/rate-limit.mjs'
import { enforceIpRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export async function POST(request: NextRequest) {
  const limited = enforceIpRateLimit(request, 'search-analytics', RATE_LIMIT_POLICIES.write)
  if (limited) return limited
  try {
    const body = await request.json()
    const location = String(body?.location || '').trim().slice(0, 80)
    const content = String(body?.content || '').trim().slice(0, 240)
    const resultCount = Math.max(0, Math.min(10000, Number(body?.resultCount) || 0))
    if (!location && !content) return Response.json({ ok: true })
    const token = await getAdminToken()
    if (!token) return Response.json({ ok: true })
    const ipHash = createHash('sha256').update(`${getClientIp(request.headers)}:${process.env.NEXT_PUBLIC_APP_URL || 'cerejavip'}`).digest('hex')
    const res = await fetch(`${PB_URL}/api/collections/search_events/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ location_query: location, content_query: content, result_count: resultCount, ip_hash: ipHash }),
      cache: 'no-store',
    })
    return Response.json({ ok: res.ok })
  } catch {
    return Response.json({ ok: true })
  }
}
