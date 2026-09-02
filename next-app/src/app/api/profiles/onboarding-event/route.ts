import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader } from '@/lib/auth-cookie'
import { enforceUserRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'
import { isAdvertiserRole } from '@/lib/advertiser-profile-access.mjs'
import { normalizeProfileOnboardingEvent } from '@/lib/profile-onboarding-event.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const sessionResponse = await fetch(`${PB_URL}/api/collections/users/auth-refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null)
  if (!sessionResponse?.ok) return Response.json({ error: 'Sessão inválida.' }, { status: 401 })

  const session = await sessionResponse.json().catch(() => null) as { record?: { id?: string; role?: string } } | null
  const userId = String(session?.record?.id || '')
  if (!userId || !isAdvertiserRole(session?.record?.role)) {
    return Response.json({ error: 'Disponível apenas para anunciantes.' }, { status: 403 })
  }

  const limited = enforceUserRateLimit(request, 'profile-onboarding-event', userId, RATE_LIMIT_POLICIES.write)
  if (limited) return limited

  const event = normalizeProfileOnboardingEvent(await request.json().catch(() => null))
  if (!event) return Response.json({ error: 'Evento inválido.' }, { status: 400 })

  console.info('[profile-onboarding]', JSON.stringify(event))
  return new Response(null, { status: 204 })
}
