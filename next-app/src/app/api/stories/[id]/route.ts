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

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/stories/records/${id}?expand=profile`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) {
      if (res.status === 404) return Response.json({ error: 'Story não encontrada' }, { status: 404 })
      return Response.json({ error: 'Erro ao carregar' }, { status: res.status })
    }
    const story = (await res.json()) as { profile?: string; expand?: { profile?: { user?: string } } }
    const profileId = story.profile
    const ownerId = story.expand?.profile?.user
    if (!profileId) return Response.json({ error: 'Story inválida' }, { status: 400 })
    if (!ownerId) {
      const profileRes = await fetch(
        `${PB_URL}/api/collections/profiles/records/${profileId}?fields=user`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const profile = profileRes.ok ? ((await profileRes.json()) as { user?: string }) : null
      if (!profile || profile.user !== userId) {
        return Response.json({ error: 'Sem permissão para excluir' }, { status: 403 })
      }
    } else if (ownerId !== userId) {
      return Response.json({ error: 'Sem permissão para excluir' }, { status: 403 })
    }

    const delRes = await fetch(`${PB_URL}/api/collections/stories/records/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!delRes.ok) return Response.json({ error: 'Erro ao excluir' }, { status: delRes.status })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: 'Erro ao excluir story' }, { status: 500 })
  }
}
