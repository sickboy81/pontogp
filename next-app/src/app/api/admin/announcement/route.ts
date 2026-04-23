import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

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
    const value = item?.value as { enabled?: boolean; message?: string; target?: string } | undefined
    const target = value?.target === 'guests' || value?.target === 'logged_in' || value?.target === 'advertiser' ? value.target : 'all'
    return Response.json({
      enabled: !!value?.enabled,
      message: typeof value?.message === 'string' ? value.message : '',
      target,
    })
  } catch {
    return Response.json({ enabled: false, message: '', target: 'all' })
  }
}

/** PATCH: atualiza aviso do topo. Body: { enabled, message, target? } */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = (await request.json()) as { enabled?: boolean; message?: string; target?: string }
  const enabled = !!body.enabled
  const message = typeof body.message === 'string' ? body.message : ''
  const target = body.target === 'guests' || body.target === 'logged_in' || body.target === 'advertiser' ? body.target : 'all'

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
          body: JSON.stringify({ value: { enabled, message, target } }),
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
        body: JSON.stringify({ key: 'announcement', value: { enabled, message, target } }),
      })
      if (!res.ok) throw new Error('Erro ao criar configuração')
    }
    return Response.json({ ok: true, enabled, message, target })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Erro ao salvar' },
      { status: 500 }
    )
  }
}
