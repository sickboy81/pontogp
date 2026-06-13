import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken, isAuthTokenExpired } from '@/lib/auth-cookie'
import { getProfileByUserId } from '@/lib/api/profiles'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'private, no-store' } as const

function todayBR(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${byType.year}-${byType.month}-${byType.day}`
}

/** GET: perfil do usuário logado. Inclui clicks (contagem em profile_clicks) para o dashboard. Sem sessão: 200 + null (evita 401 no browser em páginas públicas). */
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie')
  const token = getAuthCookieFromHeader(cookieHeader)
  if (!token) return Response.json(null, { headers: NO_STORE })
  if (isAuthTokenExpired(token)) return Response.json(null, { headers: NO_STORE })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json(null, { headers: NO_STORE })

  const adminToken = await getAdminToken()
  const profile = await getProfileByUserId(userId, adminToken || token)
  if (!profile) return Response.json(null)

  const today = todayBR()

  if (adminToken) {
    try {
      const res = await fetch(
        `${PB_URL}/api/collections/profile_clicks/records?filter=${encodeURIComponent(`profile="${profile.id}"`)}&perPage=1`,
        { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' }
      )
      if (res.ok) {
        const data = (await res.json()) as { totalItems?: number }
        profile.clicks = typeof data.totalItems === 'number' ? data.totalItems : (profile.clicks ?? 0)
      }
    } catch {
      // keep profile.clicks as-is
    }
    // Bumps usados hoje: busca registros do perfil e escolhe o de hoje no código (evita problema de filtro date no PB)
    try {
      const bumpRes = await fetch(
        `${PB_URL}/api/collections/profile_daily_bumps/records?filter=${encodeURIComponent(`profile="${profile.id}"`)}&sort=-date&perPage=14&fields=date,bumps_used`,
        { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' }
      )
      let used = 0
      if (bumpRes.ok) {
        const bumpData = (await bumpRes.json()) as { items?: { date?: string; bumps_used?: number }[] }
        const items = bumpData.items || []
        for (const record of items) {
          const d = record.date
          const dateStr = typeof d === 'string' ? d.slice(0, 10) : ''
          if (dateStr === today) {
            used = Number(record.bumps_used) || 0
            break
          }
        }
      }
      ;(profile as { bumps_used_date?: string; bumps_used_today?: number }).bumps_used_date = today
      ;(profile as { bumps_used_today?: number }).bumps_used_today = used
    } catch {
      // mantém bumps_used_today/date do perfil se existirem
    }
  } else {
    ;(profile as { bumps_used_date?: string; bumps_used_today?: number }).bumps_used_date = today
    ;(profile as { bumps_used_today?: number }).bumps_used_today = 0
  }

  return Response.json(profile)
}
