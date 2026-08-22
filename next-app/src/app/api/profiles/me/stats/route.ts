import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken, isAuthTokenExpired } from '@/lib/auth-cookie'
import { getProfileByUserId } from '@/lib/api/profiles'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { analyticsLevelForPlan } from '@/lib/plan-entitlements.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

const CLICK_TYPES = ['whatsapp', 'telegram', 'phone', 'message', 'instagram', 'twitter', 'privacy', 'onlyfans'] as const

type ClickType = (typeof CLICK_TYPES)[number]
type CountRow = { created?: string; contact_type?: string }
type StoryRow = { views?: number; created?: string }

function toPBDate(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function saoPauloDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${byType.year}-${byType.month}-${byType.day}`
}

function saoPauloHour(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  return Number.isFinite(hour) ? hour : 0
}

function dayKeys(count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const d = new Date()
    d.setDate(d.getDate() - (count - 1 - index))
    return saoPauloDateKey(d)
  })
}

async function fetchCount(token: string, collection: string, filter: string): Promise<number> {
  const res = await fetch(
    `${PB_URL}/api/collections/${collection}/records?perPage=1&fields=id&filter=${encodeURIComponent(filter)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
  )
  if (!res.ok) return 0
  const data = (await res.json()) as { totalItems?: number }
  return data.totalItems ?? 0
}

async function fetchRows<T>(token: string, collection: string, filter: string, fields: string): Promise<T[]> {
  const rows: T[] = []
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `${PB_URL}/api/collections/${collection}/records?page=${page}&perPage=500&sort=-created&fields=${fields}&filter=${encodeURIComponent(filter)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!res.ok) break
    const data = (await res.json()) as { items?: T[]; totalPages?: number }
    rows.push(...(data.items ?? []))
    if (!data.totalPages || page >= data.totalPages) break
  }
  return rows
}

export async function GET(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  if (isAuthTokenExpired(token)) return Response.json({ error: 'Sessão expirada' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const profile = await getProfileByUserId(userId, token)
  if (!profile) return Response.json({ error: 'Perfil não encontrado' }, { status: 404 })

  const adminToken = await getAdminToken()
  if (!adminToken) return Response.json({ error: 'Serviço indisponível' }, { status: 503 })

  let analyticsLevel = analyticsLevelForPlan({ slug: profile.plan_slug ?? profile.plan ?? 'gratis' })
  if (profile.plan) {
    const planRes = await fetch(`${PB_URL}/api/collections/plans/records/${profile.plan}?fields=slug,analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      cache: 'no-store',
    })
    if (planRes.ok) analyticsLevel = analyticsLevelForPlan(await planRes.json())
  }

  const now = new Date()
  const since7 = new Date(now)
  since7.setDate(since7.getDate() - 6)
  since7.setHours(0, 0, 0, 0)
  const since30 = new Date(now)
  since30.setDate(since30.getDate() - 29)
  since30.setHours(0, 0, 0, 0)

  const baseFilter = `profile="${profile.id}"`
  const views30Filter = `${baseFilter} && created >= "${toPBDate(since30)}"`
  const clicks30Filter = `${baseFilter} && created >= "${toPBDate(since30)}"`
  const views7Filter = `${baseFilter} && created >= "${toPBDate(since7)}"`
  const clicks7Filter = `${baseFilter} && created >= "${toPBDate(since7)}"`

  const [
    totalViews,
    totalClicks,
    viewsLast7Days,
    viewsLast30Days,
    clicksLast7Days,
    clicksLast30Days,
    favoritesCount,
    viewRows30,
    clickRows30,
    stories,
  ] = await Promise.all([
    fetchCount(adminToken, 'profile_views', baseFilter),
    fetchCount(adminToken, 'profile_clicks', baseFilter),
    fetchCount(adminToken, 'profile_views', views7Filter),
    fetchCount(adminToken, 'profile_views', views30Filter),
    fetchCount(adminToken, 'profile_clicks', clicks7Filter),
    fetchCount(adminToken, 'profile_clicks', clicks30Filter),
    fetchCount(adminToken, 'favorites', baseFilter),
    fetchRows<CountRow>(adminToken, 'profile_views', views30Filter, 'created'),
    fetchRows<CountRow>(adminToken, 'profile_clicks', clicks30Filter, 'created,contact_type'),
    fetchRows<StoryRow>(adminToken, 'stories', baseFilter, 'views,created'),
  ])

  const clickCountsByType = Object.fromEntries(CLICK_TYPES.map((type) => [type, 0])) as Record<ClickType, number>
  for (const row of clickRows30) {
    const type = row.contact_type as ClickType | undefined
    if (type && type in clickCountsByType) clickCountsByType[type] += 1
  }

  const keys = dayKeys(7)
  const viewsByDay = Object.fromEntries(keys.map((key) => [key, 0])) as Record<string, number>
  const clicksByDay = Object.fromEntries(keys.map((key) => [key, 0])) as Record<string, number>
  for (const row of viewRows30) {
    if (!row.created) continue
    const key = saoPauloDateKey(new Date(row.created))
    if (key in viewsByDay) viewsByDay[key] += 1
  }
  for (const row of clickRows30) {
    if (!row.created) continue
    const key = saoPauloDateKey(new Date(row.created))
    if (key in clicksByDay) clicksByDay[key] += 1
  }

  const hourly: Record<number, number> = {}
  for (const row of [...viewRows30, ...clickRows30]) {
    if (!row.created) continue
    const hour = saoPauloHour(new Date(row.created))
    hourly[hour] = (hourly[hour] ?? 0) + 1
  }
  const peak = Object.entries(hourly).sort((a, b) => b[1] - a[1])[0]
  const storyViews = stories.reduce((sum, story) => sum + (Number(story.views) || 0), 0)

  const totals = {
    views: totalViews || profile.views || 0,
    clicks: totalClicks || profile.clicks || 0,
    favorites: favoritesCount || profile.favorites_count || 0,
    stories: stories.length,
    storyViews,
  }

  if (analyticsLevel === 'views') {
    return Response.json({ analyticsLevel, totals: { views: totals.views } })
  }

  if (analyticsLevel === 'basic') {
    return Response.json({ analyticsLevel, totals: { views: totals.views, clicks: totals.clicks, favorites: totals.favorites } })
  }

  return Response.json({
    analyticsLevel,
    totals: {
      ...totals,
    },
    periods: {
      viewsLast7Days,
      viewsLast30Days,
      clicksLast7Days,
      clicksLast30Days,
    },
    clickCountsByType,
    daily: keys.map((key) => ({
      date: key,
      views: viewsByDay[key] ?? 0,
      clicks: clicksByDay[key] ?? 0,
    })),
    peakHour: peak ? { hour: Number(peak[0]), events: Number(peak[1]) } : null,
  })
}
