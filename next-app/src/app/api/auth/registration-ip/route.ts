import { NextRequest } from 'next/server'
import { enforceIpRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'
import { getClientIp } from '@/lib/rate-limit.mjs'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** POST: registra IP do cadastro. Body: { email }. Chamado pelo cliente após criar conta. Opcional: adicione o campo "registration_ip" na coleção users no PB. */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceIpRateLimit(
      request,
      'registration-ip',
      RATE_LIMIT_POLICIES.registration
    )
    if (limited) return limited

    const body = (await request.json()) as { email?: string }
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!email) return Response.json({ ok: false }, { status: 400 })

    const ip = getClientIp(request.headers)
    const token = await getAdminToken()
    if (!token) return Response.json({ ok: true }) // silencioso se admin não configurado

    const listRes = await fetch(
      `${PB_URL}/api/collections/users/records?filter=${encodeURIComponent(`email="${email}"`)}&perPage=1&fields=id,registration_ip`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!listRes.ok) return Response.json({ ok: true })
    const listData = (await listRes.json()) as { items?: { id: string; registration_ip?: string }[] }
    const user = listData.items?.[0]
    if (!user?.id) return Response.json({ ok: true })
    if (user.registration_ip?.trim()) return Response.json({ ok: true })

    await fetch(`${PB_URL}/api/collections/users/records/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ registration_ip: ip }),
    })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: true })
  }
}
