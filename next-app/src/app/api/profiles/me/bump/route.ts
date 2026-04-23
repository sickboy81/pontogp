import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getProfileByUserId } from '@/lib/api/profiles'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function todayBR(): string {
  return new Date().toLocaleDateString('fr-ca', { timeZone: 'America/Sao_Paulo' })
}

/**
 * POST: consome 1 bump (subir anúncio).
 * Usa a coleção profile_daily_bumps + last_bump_at (mesma fonte do script no Coolify).
 * Retorna { bumpsRemaining } ou erro.
 */
export async function POST(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const profile = await getProfileByUserId(userId, token)
  if (!profile) return Response.json({ error: 'Perfil não encontrado' }, { status: 404 })

  const planRef = profile.plan || 'gratis'
  let dailyBumps = 0
  try {
    const isId = typeof planRef === 'string' && planRef.length >= 15 && !['gratis', 'bronze', 'prata', 'ouro', 'vip', 'premium'].includes(planRef)
    const url = isId
      ? `${PB_URL}/api/collections/plans/records/${planRef}`
      : `${PB_URL}/api/collections/plans/records?perPage=50&filter=${encodeURIComponent(`slug="${planRef}"`)}`
    const plansRes = await fetch(url, { cache: 'no-store' })
    if (plansRes.ok) {
      const data = await plansRes.json()
      const plan = isId ? data : (data.items || [])[0]
      if (plan) dailyBumps = Number(plan.daily_bumps) || 0
    }
  } catch {
    // ignore
  }

  if (dailyBumps <= 0) {
    return Response.json({ error: 'Seu plano não inclui subidas diárias' }, { status: 400 })
  }

  const today = todayBR()
  const adminToken = await getAdminToken()
  if (!adminToken) {
    return Response.json({ error: 'Serviço indisponível' }, { status: 503 })
  }

  const authHeader = { Authorization: `Bearer ${adminToken}` }

  // Ler cota de hoje em profile_daily_bumps (fonte única, alinhada ao script Coolify)
  let usedToday = 0
  let dailyBumpRecordId: string | null = null
  try {
    const listRes = await fetch(
      `${PB_URL}/api/collections/profile_daily_bumps/records?filter=${encodeURIComponent(`profile="${profile.id}" && date="${today}"`)}&perPage=1&fields=id,bumps_used`,
      { headers: authHeader, cache: 'no-store' }
    )
    if (listRes.ok) {
      const listData = (await listRes.json()) as { items?: { id: string; bumps_used?: number }[] }
      const record = listData.items?.[0]
      if (record) {
        dailyBumpRecordId = record.id
        usedToday = Number(record.bumps_used) || 0
      }
    }
  } catch {
    return Response.json({ error: 'Erro ao verificar cota' }, { status: 502 })
  }

  if (usedToday >= dailyBumps) {
    return Response.json(
      { error: 'Você já usou todas as subidas de hoje', bumpsRemaining: 0 },
      { status: 400 }
    )
  }

  // Formato aceito pelo PocketBase para campo type "date": YYYY-MM-DD HH:mm:ss (igual ao site antigo)
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  if (dailyBumpRecordId) {
    const patchRes = await fetch(
      `${PB_URL}/api/collections/profile_daily_bumps/records/${dailyBumpRecordId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ bumps_used: usedToday + 1 }),
      }
    )
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao subir anúncio' },
        { status: patchRes.status }
      )
    }
  } else {
    const createRes = await fetch(`${PB_URL}/api/collections/profile_daily_bumps/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        profile: profile.id,
        date: today,
        bumps_used: 1,
      }),
    })
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao subir anúncio' },
        { status: createRes.status }
      )
    }
  }

  const profileRes = await fetch(`${PB_URL}/api/collections/profiles/records/${profile.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ last_bump_at: now }),
  })
  if (!profileRes.ok) {
    return Response.json(
      { error: 'Subida registrada, mas falha ao atualizar perfil' },
      { status: 500 }
    )
  }

  return Response.json({
    success: true,
    bumpsRemaining: dailyBumps - usedToday - 1,
  })
}
