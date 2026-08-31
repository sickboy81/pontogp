import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { getPlanLifecycleEvents } from '@/lib/plan-reminder.mjs'
import { authorizeSession } from '@/lib/authenticated-session.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

const LIFECYCLE_TITLES: Record<string, string> = {
  plan_expiring: 'Seu plano está perto de vencer',
  plan_expired: 'Seu plano venceu',
  contact_expiring: 'Seus contatos estão perto de expirar',
  contact_expired: 'Seus contatos foram desativados',
  search_removed: 'Seu perfil saiu da busca',
  profile_archived: 'Seu perfil foi arquivado',
}

/** Recupera lembretes mesmo quando o cron esteve indisponível. A chave é o link,
 * portanto a operação é idempotente e não cria avisos repetidos. */
async function ensureLifecycleNotifications(userId: string, adminToken: string) {
  const headers = { Authorization: `Bearer ${adminToken}` }
  const profilesRes = await fetch(
    `${PB_URL}/api/collections/profiles/records?filter=${encodeURIComponent(`user = "${userId}" && (search_expires_at != "" || contact_expires_at != "")`)}&perPage=50&sort=-updated&fields=id,name,search_expires_at,contact_expires_at`,
    { headers, cache: 'no-store' },
  )
  if (!profilesRes.ok) return
  const data = (await profilesRes.json()) as { items?: Array<{ id: string; name?: string; search_expires_at?: string; contact_expires_at?: string }> }
  for (const profile of data.items || []) {
    for (const event of getPlanLifecycleEvents(profile, new Date())) {
      const link = `/planos?renew=1&profile=${profile.id}&event=${event.type}`
      const existingRes = await fetch(
        `${PB_URL}/api/collections/notifications/records?perPage=1&filter=${encodeURIComponent(`recipient = "${userId}" && type = "${event.type}" && link = "${link.replace(/"/g, '\\"')}"`)}&fields=id`,
        { headers, cache: 'no-store' },
      )
      if (!existingRes.ok || ((await existingRes.json()) as { totalItems?: number }).totalItems) continue
      const title = LIFECYCLE_TITLES[event.type] || 'Atualização do seu anúncio'
      await fetch(`${PB_URL}/api/collections/notifications/records`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: userId,
          title,
          message: `${title}. Acesse os planos para ver os detalhes.`,
          type: event.type,
          read: false,
          link,
          created_at: new Date().toISOString(),
        }),
      })
    }
  }
}

/** GET: lista notificações do usuário logado. Query: page=1, perPage=20, unreadOnly=false. */
export async function GET(request: NextRequest) {
  const token = getToken(request)
  const auth = await authorizeSession({ pbUrl: PB_URL, sessionToken: token, getAdminTokenImpl: getAdminToken })
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  const { userId, adminToken } = auth

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 20))
  const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true'

  const filter = unreadOnly
    ? `recipient = "${userId}" && read = false`
    : `recipient = "${userId}"`

  try {
    await ensureLifecycleNotifications(userId, adminToken)
    const res = await fetch(
      `${PB_URL}/api/collections/notifications/records?page=${page}&perPage=${perPage}&filter=${encodeURIComponent(filter)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!res.ok) return Response.json({ items: [], totalItems: 0, unreadCount: 0 })
    const data = await res.json()
    const items = (data.items || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      type: r.type,
      read: r.read,
      link: r.link,
      created: r.created ?? r.created_at,
    }))
    const countRes = await fetch(
      `${PB_URL}/api/collections/notifications/records?perPage=1&filter=${encodeURIComponent(`recipient = "${userId}" && read = false`)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    let unreadCount = 0
    if (countRes.ok) {
      const countData = await countRes.json()
      unreadCount = countData.totalItems ?? 0
    }
    return Response.json({ items, totalItems: data.totalItems ?? 0, unreadCount })
  } catch {
    return Response.json({ items: [], totalItems: 0, unreadCount: 0 })
  }
}
