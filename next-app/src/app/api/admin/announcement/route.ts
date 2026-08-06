import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'
const DEFAULT_BACKGROUND_COLOR = '#422006'
const DEFAULT_TEXT_COLOR = '#fef3c7'

function normalizeAnnouncement(value: unknown) {
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

/** GET: lê aviso do topo (admin). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "announcement"')}&perPage=1&fields=id,value`,
      { headers: { Authorization: `Bearer ${auth.token}` }, cache: 'no-store' }
    )
    if (!res.ok) return Response.json({ enabled: false, message: '' })
    const data = await res.json()
    const item = data.items?.[0]
    return Response.json(normalizeAnnouncement(item?.value))
  } catch {
    return Response.json({ enabled: false, message: '', target: 'all' })
  }
}

/** PATCH: atualiza aviso do topo. Body: { enabled, message, target? } */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = (await request.json()) as {
    enabled?: boolean
    message?: string
    target?: string
    background_color?: string
    text_color?: string
    display_mode?: string
    speed?: number
  }
  const enabled = !!body.enabled
  const message = typeof body.message === 'string' ? body.message : ''
  const target = body.target === 'guests' || body.target === 'logged_in' || body.target === 'advertiser' ? body.target : 'all'
  const isColor = (color: unknown) => typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)
  const background_color = isColor(body.background_color) ? body.background_color : DEFAULT_BACKGROUND_COLOR
  const text_color = isColor(body.text_color) ? body.text_color : DEFAULT_TEXT_COLOR
  const display_mode = body.display_mode === 'marquee' ? 'marquee' : 'static'
  const speed = typeof body.speed === 'number' && Number.isFinite(body.speed) ? Math.min(200, Math.max(20, Math.round(body.speed))) : 60
  const value = { enabled, message, target, background_color, text_color, display_mode, speed }

  try {
    const listRes = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "announcement"')}&perPage=1&fields=id`,
      { headers: { Authorization: `Bearer ${auth.token}` }, cache: 'no-store' }
    )
    if (!listRes.ok) throw new Error('Erro ao buscar configuração')
    const listData = await listRes.json()
    const existing = listData.items?.[0] as { id?: string } | undefined

    if (existing?.id) {
      const res = await fetch(
        `${PB_URL}/api/collections/settings/records/${existing.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ value }),
        }
      )
      if (!res.ok) throw new Error('Erro ao atualizar')
    } else {
      const res = await fetch(`${PB_URL}/api/collections/settings/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ key: 'announcement', value }),
      })
      if (!res.ok) throw new Error('Erro ao criar configuração')
    }
    return Response.json({ ok: true, ...value })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Erro ao salvar' },
      { status: 500 }
    )
  }
}
