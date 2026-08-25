import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { isAdminRole } from '@/lib/auth-roles'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

type PocketBaseRecord = Record<string, unknown> & { id: string }

async function listAll(token: string, collection: string): Promise<PocketBaseRecord[]> {
  const records: PocketBaseRecord[] = []
  let page = 1
  while (page <= 50) {
    const response = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=500&page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!response.ok) return records
    const data = (await response.json()) as { items?: PocketBaseRecord[]; totalPages?: number }
    records.push(...(data.items || []))
    if (!data.totalPages || page >= data.totalPages) return records
    page += 1
  }
  return records
}

async function deleteRecord(token: string, collection: string, id: string) {
  await fetch(`${PB_URL}/api/collections/${collection}/records/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

async function deleteRelatedRecords(token: string, collection: string, fields: string[], value: string) {
  const records = await listAll(token, collection)
  await Promise.all(
    records
      .filter((record) => fields.some((field) => record[field] === value || (Array.isArray(record[field]) && record[field].includes(value))))
      .map((record) => deleteRecord(token, collection, record.id))
  )
}

/** Exclui a própria conta após reautenticação explícita por senha. */
export async function POST(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  const userId = token ? getUserIdFromToken(token) : null
  if (!token || !userId) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { currentPassword?: string; confirmation?: string } | null
  if (!body?.currentPassword || body.confirmation !== 'EXCLUIR') {
    return Response.json({ error: 'Confirme a exclusão digitando EXCLUIR e informe sua senha atual.' }, { status: 400 })
  }

  const sessionResponse = await fetch(`${PB_URL}/api/collections/users/records/${encodeURIComponent(userId)}?fields=id,email,role`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!sessionResponse.ok) return Response.json({ error: 'Sessão inválida. Entre novamente para continuar.' }, { status: 401 })
  const account = (await sessionResponse.json()) as { id: string; email?: string; role?: string }
  if (!account.email) return Response.json({ error: 'Não foi possível confirmar a conta.' }, { status: 400 })
  if (isAdminRole(account.role)) return Response.json({ error: 'Contas administrativas não podem ser excluídas por esta área.' }, { status: 400 })

  const passwordCheck = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: account.email, password: body.currentPassword }),
  })
  const passwordData = (await passwordCheck.json().catch(() => null)) as { record?: { id?: string } } | null
  if (!passwordCheck.ok || passwordData?.record?.id !== userId) {
    return Response.json({ error: 'A senha atual está incorreta.' }, { status: 400 })
  }

  const adminToken = await getAdminToken()
  if (!adminToken) return Response.json({ error: 'Serviço indisponível. Tente novamente mais tarde.' }, { status: 503 })

  try {
    await Promise.all([
      deleteRelatedRecords(adminToken, 'messages', ['sender', 'recipient'], userId),
      deleteRelatedRecords(adminToken, 'notifications', ['recipient'], userId),
      deleteRelatedRecords(adminToken, 'favorites', ['user'], userId),
      deleteRelatedRecords(adminToken, 'subscriptions', ['user'], userId),
      deleteRelatedRecords(adminToken, 'verification_requests', ['user'], userId),
      deleteRelatedRecords(adminToken, 'verification_tokens', ['user_id'], userId),
      deleteRelatedRecords(adminToken, 'message_blocks', ['user_a', 'user_b'], userId),
      deleteRelatedRecords(adminToken, 'story_comments', ['user'], userId),
      deleteRelatedRecords(adminToken, 'story_likes', ['user'], userId),
      deleteRelatedRecords(adminToken, 'comment_likes', ['user'], userId),
      deleteRelatedRecords(adminToken, 'payments', ['user'], userId),
      deleteRelatedRecords(adminToken, 'push_subscriptions', ['user'], userId),
      deleteRelatedRecords(adminToken, 'reports', ['reported_by'], userId),
    ])

    const profiles = (await listAll(adminToken, 'profiles')).filter((profile) => profile.user === userId)
    for (const profile of profiles) {
      const mediaIds = new Set<string>()
      for (const field of ['photos', 'videos']) {
        for (const id of Array.isArray(profile[field]) ? profile[field] : []) if (typeof id === 'string') mediaIds.add(id)
      }
      if (typeof profile.audio === 'string') mediaIds.add(profile.audio)
      await deleteRelatedRecords(adminToken, 'stories', ['profile'], profile.id)
      await deleteRecord(adminToken, 'profiles', profile.id)
      await Promise.all([...mediaIds].map((id) => deleteRecord(adminToken, 'files', id)))
    }

    const deleteUser = await fetch(`${PB_URL}/api/collections/users/records/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    if (!deleteUser.ok) return Response.json({ error: 'Não foi possível concluir a exclusão da conta.' }, { status: deleteUser.status })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Não foi possível concluir a exclusão da conta.' }, { status: 500 })
  }
}
