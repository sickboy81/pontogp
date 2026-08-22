import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { isAdminRole } from '@/lib/auth-roles'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

async function getPbToken(fallback: string) {
  return (await getAdminToken()) || fallback
}

async function countAdminUsers(admToken: string): Promise<number> {
  try {
    const res = await fetch(
      `${PB_URL}/api/collections/users/records?perPage=500&page=1&fields=id,role`,
      { headers: { Authorization: `Bearer ${admToken}` }, cache: 'no-store' }
    )
    if (!res.ok) return 0
    const data = (await res.json()) as { items?: { id?: string; role?: string }[] }
    return (data.items || []).filter((u) => isAdminRole(u.role)).length
  } catch {
    return 0
  }
}

function mapUserPublic(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    email: r.email as string,
    name: (r.name as string) || '',
    first_name: (r.first_name as string) || '',
    last_name: (r.last_name as string) || '',
    phone: (r.phone as string) || '',
    role: (r.role as string) || 'user',
    status: (r.status as string) || 'active',
    verified: !!(r.verified as boolean),
    document_verified: !!(r.document_verified as boolean),
    created: (r.created as string) || null,
  }
}

const ALLOWED_PATCH = new Set([
  'name',
  'first_name',
  'last_name',
  'phone',
  'role',
  'status',
  'verified',
  'document_verified',
])

/** GET: detalhe do utilizador. Apenas admin. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  if (!id) return Response.json({ error: 'id obrigatório' }, { status: 400 })
  const token = await getPbToken(auth.token)
  try {
    const res = await fetch(`${PB_URL}/api/collections/users/records/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      if (res.status === 404) return Response.json({ error: 'Utilizador não encontrado' }, { status: 404 })
      return Response.json({ error: 'Erro ao carregar' }, { status: res.status })
    }
    const r = (await res.json()) as Record<string, unknown>
    return Response.json(mapUserPublic(r))
  } catch {
    return Response.json({ error: 'Erro ao carregar utilizador' }, { status: 500 })
  }
}

/** PATCH: atualiza campos do utilizador. Apenas admin. Não remove o último admin. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  if (!id) return Response.json({ error: 'id obrigatório' }, { status: 400 })

  const token = await getPbToken(auth.token)
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  for (const key of ALLOWED_PATCH) {
    if (key in body) {
      const v = body[key]
      if (key === 'verified' || key === 'document_verified') {
        update[key] = !!v
      } else if (key === 'phone' || typeof v === 'string') {
        update[key] = v === '' ? null : v
      }
    }
  }
  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'Nenhum campo permitido no body' }, { status: 400 })
  }

  if (update.role != null) {
    const getRes = await fetch(`${PB_URL}/api/collections/users/records/${id}?fields=id,role`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!getRes.ok) {
      return Response.json({ error: 'Utilizador não encontrado' }, { status: 404 })
    }
    const current = (await getRes.json()) as { role?: string }
    const wasAdmin = isAdminRole(current.role)
    const willBeAdmin = isAdminRole(String(update.role))
    if (wasAdmin && !willBeAdmin) {
      const admins = await countAdminUsers(token)
      if (admins <= 1) {
        return Response.json(
          { error: 'Não é possível retirar a função de admin: só existe um administrador.' },
          { status: 400 }
        )
      }
    }
  }

  try {
    const res = await fetch(`${PB_URL}/api/collections/users/records/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(update),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao atualizar' },
        { status: res.status }
      )
    }
    const r = (await res.json()) as Record<string, unknown>
    return Response.json(mapUserPublic(r))
  } catch {
    return Response.json({ error: 'Erro ao atualizar utilizador' }, { status: 500 })
  }
}

/** POST: reenvia o email de confirmação. Apenas admin. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  if (!id) return Response.json({ error: 'id obrigatório' }, { status: 400 })
  const token = await getPbToken(auth.token)
  try {
    const userRes = await fetch(`${PB_URL}/api/collections/users/records/${id}?fields=id,email,verified`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (!userRes.ok) return Response.json({ error: 'Utilizador não encontrado' }, { status: userRes.status })
    const user = (await userRes.json()) as { email?: string; verified?: boolean }
    if (user.verified) return Response.json({ error: 'Este email já está confirmado.' }, { status: 400 })
    if (!user.email) return Response.json({ error: 'Utilizador sem email.' }, { status: 400 })
    const resendRes = await fetch(`${PB_URL}/api/collections/users/request-verification`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: user.email }) })
    if (!resendRes.ok) return Response.json({ error: 'Não foi possível reenviar o email.' }, { status: resendRes.status })
    return Response.json({ message: 'Email de confirmação reenviado.' })
  } catch {
    return Response.json({ error: 'Erro ao reenviar email de confirmação.' }, { status: 500 })
  }
}
