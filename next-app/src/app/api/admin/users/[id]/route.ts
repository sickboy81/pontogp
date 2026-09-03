import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { isAdminRole } from '@/lib/auth-roles'
import { getDocumentVerificationState } from '@/lib/verification-document-status.mjs'

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

function mapUserPublic(r: Record<string, unknown>, documentVerified = !!(r.document_verified as boolean)) {
  return {
    id: r.id as string,
    email: r.email as string,
    name: (r.name as string) || '',
    full_name: (r.full_name as string) || '',
    display_name: (r.display_name as string) || (r.name as string) || '',
    age: Number(r.age) || null,
    first_name: (r.first_name as string) || '',
    last_name: (r.last_name as string) || '',
    phone: (r.phone as string) || '',
    role: (r.role as string) || 'user',
    status: (r.status as string) || 'active',
    verified: !!(r.verified as boolean),
    document_verified: documentVerified,
    created: (r.created as string) || null,
    plan: (r.plan as string) || 'gratis',
  }
}

async function getProfileSummary(token: string, userId: string) {
  try {
    const filter = encodeURIComponent(`user = "${userId}"`)
    const res = await fetch(`${PB_URL}/api/collections/profiles/records?filter=${filter}&perPage=1&fields=id,name,status,category,city,state,plan,bio,created&expand=photos`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json() as { items?: Record<string, unknown>[] }
    const profile = data.items?.[0]
    if (!profile) return null
    const expanded = profile.expand as { photos?: unknown[] } | undefined
    return {
      id: String(profile.id || ''),
      name: String(profile.name || ''),
      status: String(profile.status || 'inactive'),
      category: String(profile.category || ''),
      city: String(profile.city || ''),
      state: String(profile.state || ''),
      plan: String(profile.plan || 'gratis'),
      bioLength: String(profile.bio || '').trim().length,
      photoCount: Array.isArray(expanded?.photos) ? expanded.photos.length : 0,
      created: String(profile.created || ''),
    }
  } catch {
    return null
  }
}

async function getDocumentReviews(token: string, userId: string) {
  try {
    const filter = encodeURIComponent(`user = "${userId}" && (status = "approved" || status = "rejected")`)
    const res = await fetch(
      `${PB_URL}/api/collections/verification_requests/records?filter=${filter}&perPage=500&fields=status,reviewed_at,created`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!res.ok) return []
    const data = (await res.json()) as { items?: Record<string, unknown>[] }
    return data.items || []
  } catch {
    return []
  }
}

const ALLOWED_PATCH = new Set([
  'name',
  'full_name',
  'display_name',
  'age',
  'first_name',
  'last_name',
  'phone',
  'role',
  'status',
  'verified',
  'document_verified',
  'plan',
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
    const [documentReviews, profile] = await Promise.all([getDocumentReviews(token, id), getProfileSummary(token, id)])
    const documentVerified = getDocumentVerificationState(r.document_verified === true, documentReviews)
    return Response.json({ ...mapUserPublic(r, documentVerified), profile })
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
      } else if (key === 'age') {
        if (v === null || v === '') {
          update[key] = null
          continue
        }
        const age = Number(v)
        if (!Number.isInteger(age) || age < 18 || age > 100) return Response.json({ error: 'A idade deve estar entre 18 e 100 anos.' }, { status: 400 })
        update[key] = age
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
    if (update.plan != null) {
      const requestedPlan = String(update.plan).trim().toLowerCase()
      const planRes = await fetch(`${PB_URL}/api/collections/plans/records?filter=${encodeURIComponent(`slug = "${requestedPlan}" || id = "${requestedPlan}"`)}&perPage=1&fields=id,slug`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      if (!planRes.ok) return Response.json({ error: 'Não foi possível validar o plano.' }, { status: 502 })
      const planData = await planRes.json() as { items?: { id: string; slug?: string }[] }
      const plan = planData.items?.[0]
      if (!plan) return Response.json({ error: 'Plano não encontrado.' }, { status: 400 })
      update.plan = plan.slug || requestedPlan
      const profilesRes = await fetch(`${PB_URL}/api/collections/profiles/records?filter=${encodeURIComponent(`user = "${id}"`)}&perPage=50&fields=id`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      if (profilesRes.ok) {
        const profiles = await profilesRes.json() as { items?: { id: string }[] }
        for (const profile of profiles.items || []) await fetch(`${PB_URL}/api/collections/profiles/records/${profile.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ plan: plan.id }) })
      }
    }
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

async function deleteRelatedRecords(token: string, collection: string, fields: string[], userId: string) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=500&page=1`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return
  const data = await res.json() as { items?: Record<string, unknown>[] }
  for (const record of data.items || []) {
    if (fields.some((field) => record[field] === userId || (Array.isArray(record[field]) && (record[field] as unknown[]).includes(userId)))) {
      await fetch(`${PB_URL}/api/collections/${collection}/records/${encodeURIComponent(String(record.id))}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    }
  }
}

/** DELETE: remove uma conta e o seu perfil, apenas por ação administrativa explícita. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  if (!id) return Response.json({ error: 'id obrigatório' }, { status: 400 })
  if (id === auth.userId) return Response.json({ error: 'Não é possível excluir a própria conta administrativa.' }, { status: 400 })
  const token = await getPbToken(auth.token)
  try {
    const currentRes = await fetch(`${PB_URL}/api/collections/users/records/${id}?fields=id,role`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (!currentRes.ok) return Response.json({ error: 'Utilizador não encontrado' }, { status: 404 })
    const current = await currentRes.json() as { role?: string }
    if (isAdminRole(current.role) && await countAdminUsers(token) <= 1) return Response.json({ error: 'Não é possível excluir o último administrador.' }, { status: 400 })
    // Apaga primeiro os registros que mantêm relações obrigatórias com a conta.
    await deleteRelatedRecords(token, 'messages', ['sender', 'recipient'], id)
    await deleteRelatedRecords(token, 'notifications', ['recipient'], id)
    await deleteRelatedRecords(token, 'favorites', ['user'], id)
    await deleteRelatedRecords(token, 'subscriptions', ['user'], id)
    await deleteRelatedRecords(token, 'verification_requests', ['user'], id)
    await deleteRelatedRecords(token, 'verification_tokens', ['user_id'], id)
    await deleteRelatedRecords(token, 'message_blocks', ['user_a', 'user_b'], id)
    await deleteRelatedRecords(token, 'story_comments', ['user'], id)
    await deleteRelatedRecords(token, 'story_likes', ['user'], id)
    await deleteRelatedRecords(token, 'comment_likes', ['user'], id)
    await deleteRelatedRecords(token, 'payments', ['user'], id)
    await deleteRelatedRecords(token, 'push_subscriptions', ['user'], id)
    await deleteRelatedRecords(token, 'reports', ['reported_by'], id)
    const profileRes = await fetch(`${PB_URL}/api/collections/profiles/records?perPage=500&page=1`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (profileRes.ok) {
      const profiles = await profileRes.json() as { items?: { id: string; user?: string }[] }
      for (const profile of (profiles.items || []).filter((profile) => profile.user === id)) {
        await deleteRelatedRecords(token, 'stories', ['profile'], profile.id)
        await fetch(`${PB_URL}/api/collections/profiles/records/${encodeURIComponent(profile.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      }
    }
    const res = await fetch(`${PB_URL}/api/collections/users/records/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      const detail = await res.json().catch(() => ({})) as { message?: string; data?: unknown }
      return Response.json({
        error: detail.message || 'Não foi possível excluir a conta.',
        details: detail.data,
      }, { status: res.status })
    }
    return Response.json({ ok: true })
  } catch { return Response.json({ error: 'Erro ao excluir conta.' }, { status: 500 }) }
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
