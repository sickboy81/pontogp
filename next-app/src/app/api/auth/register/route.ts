import { NextRequest } from 'next/server'
import { enforceIpRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'
import { getClientIp } from '@/lib/rate-limit.mjs'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** Cria uma conta já associada ao IP da requisição, sem depender do navegador. */
export async function POST(request: NextRequest) {
  const limited = enforceIpRateLimit(request, 'registration', RATE_LIMIT_POLICIES.registration)
  if (limited) return limited

  const body = await request.json().catch(() => null) as {
    email?: unknown
    password?: unknown
    passwordConfirm?: unknown
    role?: unknown
    firstName?: unknown
    lastName?: unknown
    fullName?: unknown
    displayName?: unknown
    age?: unknown
  } | null
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  const passwordConfirm = String(body?.passwordConfirm ?? '')
  const role = body?.role === 'advertiser' ? 'advertiser' : body?.role === 'user' ? 'user' : null
  if (!email || !password || !passwordConfirm || !role) {
    return Response.json({ error: 'Dados de cadastro incompletos.' }, { status: 400 })
  }

  const adminToken = await getAdminToken()
  if (!adminToken) {
    return Response.json({ error: 'O cadastro está temporariamente indisponível. Tente novamente em instantes.' }, { status: 503 })
  }

  const firstName = String(body?.firstName ?? '').trim()
  const lastName = String(body?.lastName ?? '').trim()
  const fullName = String(body?.fullName ?? '').trim() || [firstName, lastName].filter(Boolean).join(' ').trim()
  const displayName = String(body?.displayName ?? '').trim() || fullName
  const age = body?.age == null || body.age === '' ? null : Number(body.age)
  const registrationIp = getClientIp(request.headers)
  const payload = {
    email,
    emailVisibility: true,
    password,
    passwordConfirm,
    name: displayName,
    full_name: fullName,
    display_name: displayName,
    age: Number.isFinite(age) ? age : null,
    first_name: firstName,
    last_name: lastName,
    verified: false,
    document_verified: false,
    role,
    status: 'active',
    registration_ip: registrationIp,
  }

  try {
    const res = await fetch(`${PB_URL}/api/collections/users/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    if (!res.ok) {
      const detail = await res.json().catch(() => ({})) as { message?: string; data?: Record<string, unknown> }
      return Response.json({ error: detail.message || 'Não foi possível criar a conta.', data: detail.data }, { status: res.status })
    }

    await fetch(`${PB_URL}/api/collections/users/request-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ email }),
    }).catch(() => undefined)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Não foi possível criar a conta agora.' }, { status: 502 })
  }
}
