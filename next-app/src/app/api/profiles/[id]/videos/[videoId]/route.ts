import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { authorizeProfileOwner } from '@/lib/profile-owner-record.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

function extractId(urlOrId: string): string {
  if (!urlOrId) return ''
  const m = urlOrId.match(/([a-z0-9]{15})$/i)
  return m ? m[1] : urlOrId
}

/** DELETE: remove vídeo do perfil. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  const token = getToken(_request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const { id: profileId, videoId: rawVideoId } = await params
  if (!profileId || !rawVideoId) {
    return Response.json({ error: 'ID do perfil e do vídeo obrigatórios' }, { status: 400 })
  }

  const videoId = extractId(rawVideoId)

  const authorization = await authorizeProfileOwner({
    pbUrl: PB_URL,
    profileId,
    sessionToken: token,
    fields: 'id,user,videos',
    getAdminTokenImpl: getAdminToken,
  })
  if (!authorization.ok) return Response.json({ error: authorization.error }, { status: authorization.status })
  const ownership = authorization.profile as { videos?: string[] }

  const videos = ownership.videos || []
  if (!videos.some((v) => extractId(v) === videoId)) {
    return Response.json({ error: 'Vídeo não encontrado no perfil' }, { status: 404 })
  }

  const newVideos = videos.filter((v) => extractId(v) !== videoId)

  try {
    const patchRes = await fetch(`${PB_URL}/api/collections/profiles/records/${profileId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ videos: newVideos }),
    })

    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao atualizar perfil' },
        { status: patchRes.status }
      )
    }

    await fetch(`${PB_URL}/api/collections/files/records/${videoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: 'Erro ao remover vídeo' }, { status: 500 })
  }
}
