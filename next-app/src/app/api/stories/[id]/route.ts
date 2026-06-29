import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** DELETE: remove story. Apenas dono do perfil pode. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(_request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const { id } = await params
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  const owner = await assertStoryOwner(token, userId, id)
  if (!('ok' in owner)) {
    const msg =
      owner.status === 403 ? 'Sem permissão para excluir' : owner.error
    return Response.json({ error: msg }, { status: owner.status })
  }

  try {
    const delRes = await fetch(`${PB_URL}/api/collections/stories/records/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!delRes.ok) return Response.json({ error: 'Erro ao excluir' }, { status: delRes.status })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Erro ao excluir Cereja Story' }, { status: 500 })
  }
}

async function assertStoryOwner(
  token: string,
  userId: string,
  storyId: string
): Promise<{ ok: true } | { error: string; status: number }> {
  const res = await fetch(
    `${PB_URL}/api/collections/stories/records/${storyId}?expand=profile`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) {
    if (res.status === 404) return { error: 'Cereja Story não encontrada', status: 404 }
    return { error: 'Erro ao carregar', status: res.status }
  }
  const story = (await res.json()) as { profile?: string; expand?: { profile?: { user?: string } } }
  const profileId = story.profile
  const ownerId = story.expand?.profile?.user
  if (!profileId) return { error: 'Cereja Story inválida', status: 400 }
  if (!ownerId) {
    const profileRes = await fetch(
      `${PB_URL}/api/collections/profiles/records/${profileId}?fields=user`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const profile = profileRes.ok ? ((await profileRes.json()) as { user?: string }) : null
    if (!profile || profile.user !== userId) {
      return { error: 'Sem permissão', status: 403 }
    }
  } else if (ownerId !== userId) {
    return { error: 'Sem permissão', status: 403 }
  }
  return { ok: true }
}

/** PATCH: atualiza texto da story. Apenas dono do perfil. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const { id } = await params
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  let body: { text?: unknown }
  try {
    body = (await request.json()) as { text?: unknown }
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (typeof body.text !== 'string') {
    return Response.json({ error: 'Campo text (string) obrigatório' }, { status: 400 })
  }
  const text = body.text.slice(0, 2000)

  const owner = await assertStoryOwner(token, userId, id)
  if (!('ok' in owner)) {
    return Response.json({ error: owner.error }, { status: owner.status })
  }

  try {
    const patchRes = await fetch(`${PB_URL}/api/collections/stories/records/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
    if (!patchRes.ok) {
      return Response.json({ error: 'Erro ao atualizar' }, { status: patchRes.status })
    }
    const updated = (await patchRes.json()) as { id: string; text?: string }
    return Response.json({ id: updated.id, text: updated.text ?? text })
  } catch {
    return Response.json({ error: 'Erro ao atualizar Cereja Story' }, { status: 500 })
  }
}
