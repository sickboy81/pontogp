import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { mapProfile } from '@/lib/api/profiles'
import { ADVERTISER_PROFILE_OWNER_FILTER } from '@/lib/advertiser-profile-access.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

const ALLOWED_STATUS = ['active', 'inactive', 'suspended', 'muted', 'archived']

/** GET: visualização administrativa de um perfil, inclusive rascunhos. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  if (!/^[a-z0-9]{15}$/i.test(id)) return Response.json({ error: 'Perfil inválido.' }, { status: 400 })
  const adminToken = await getAdminToken()
  if (!adminToken) return Response.json({ error: 'A credencial administrativa do servidor não está configurada.' }, { status: 503 })

  try {
    const filter = encodeURIComponent(`id = "${id}" && ${ADVERTISER_PROFILE_OWNER_FILTER}`)
    const response = await fetch(`${PB_URL}/api/collections/profiles/records?filter=${filter}&perPage=1&expand=photos,videos,audio,plan,user`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      cache: 'no-store',
    })
    if (!response.ok) return Response.json({ error: 'Não foi possível abrir este perfil.' }, { status: 502 })
    const data = await response.json() as { items?: Array<Record<string, unknown>> }
    const profile = data.items?.[0] ? mapProfile(data.items[0]) : null
    if (!profile) return Response.json({ error: 'Perfil não encontrado.' }, { status: 404 })
    return Response.json({ profile })
  } catch {
    return Response.json({ error: 'Não foi possível abrir este perfil.' }, { status: 502 })
  }
}

/** PATCH: atualiza perfil (apenas admin). Body: { status }. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  const body = (await request.json()) as { status?: string }
  const status = body?.status?.trim()
  if (!status || !ALLOWED_STATUS.includes(status)) {
    return Response.json(
      { error: `status deve ser um de: ${ALLOWED_STATUS.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(`${PB_URL}/api/collections/profiles/records/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao atualizar' },
        { status: res.status }
      )
    }
    const updated = await res.json()
    return Response.json(updated)
  } catch {
    return Response.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
