import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: lê configuração de manutenção (admin). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "maintenance"')}&perPage=1&fields=id,value`,
      { headers: { Authorization: `Bearer ${auth.token}` }, cache: 'no-store' }
    )
    if (!res.ok) return Response.json({ enabled: false, message: 'Site em manutenção. Voltaremos em breve!' })
    const data = await res.json()
    const item = data.items?.[0]
    const value = item?.value
    return Response.json({
      enabled: !!value?.enabled,
      message: value?.message ?? 'Site em manutenção. Voltaremos em breve!',
    })
  } catch {
    return Response.json({ enabled: false, message: 'Site em manutenção. Voltaremos em breve!' })
  }
}

/** PATCH: atualiza configuração de manutenção (admin). Body: { enabled, message } */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = (await request.json()) as Record<string, unknown>
    const enabled = !!body.enabled
    const message = typeof body.message === 'string' ? body.message : 'Site em manutenção. Voltaremos em breve!'

    const listRes = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "maintenance"')}&perPage=1&fields=id`,
      { headers: { Authorization: `Bearer ${auth.token}` }, cache: 'no-store' }
    )
    if (!listRes.ok) throw new Error('Erro ao buscar configuração')

    const listData = await listRes.json()
    const existing = listData.items?.[0]

    if (existing?.id) {
      const updateRes = await fetch(
        `${PB_URL}/api/collections/settings/records/${existing.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ value: { enabled, message } }),
        }
      )
      if (!updateRes.ok) throw new Error('Erro ao atualizar')
    } else {
      const createRes = await fetch(`${PB_URL}/api/collections/settings/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ key: 'maintenance', value: { enabled, message } }),
      })
      if (!createRes.ok) throw new Error('Erro ao criar configuração')
    }

    return Response.json({ ok: true, enabled, message })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Erro ao salvar' },
      { status: 500 }
    )
  }
}
