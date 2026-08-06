import { NextRequest } from 'next/server'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'
const CACHE_CONTROL = 'no-store'
const DEFAULT_BACKGROUND_COLOR = '#422006'
const DEFAULT_TEXT_COLOR = '#fef3c7'

function readAnnouncement(value: unknown) {
  const item = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const target = item.target === 'guests' || item.target === 'logged_in' || item.target === 'advertiser' ? item.target : 'all'
  const displayMode = item.display_mode === 'marquee' ? 'marquee' : 'static'
  const speed = typeof item.speed === 'number' && Number.isFinite(item.speed) ? Math.min(200, Math.max(20, Math.round(item.speed))) : 60
  const isColor = (color: unknown) => typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)
  return {
    enabled: !!item.enabled,
    message: typeof item.message === 'string' ? item.message : '',
    target,
    background_color: isColor(item.background_color) ? item.background_color : DEFAULT_BACKGROUND_COLOR,
    text_color: isColor(item.text_color) ? item.text_color : DEFAULT_TEXT_COLOR,
    display_mode: displayMode,
    speed,
  } as const
}

/** GET: aviso do topo (announcement). Público. */
export async function GET(_request: NextRequest) {
  try {
    const res = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "announcement"')}&perPage=1&fields=id,value`,
      { cache: 'no-store' }
    )
    if (!res.ok) return Response.json({ enabled: false, message: '', target: 'all' })
    const data = await res.json()
    const item = data.items?.[0]
    const payload = readAnnouncement(item?.value)
    return Response.json(payload, {
      headers: { 'Cache-Control': CACHE_CONTROL },
    })
  } catch {
    return Response.json(
      { enabled: false, message: '', target: 'all' },
      { headers: { 'Cache-Control': CACHE_CONTROL } }
    )
  }
}
