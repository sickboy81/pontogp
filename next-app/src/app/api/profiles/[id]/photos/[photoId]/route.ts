import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { canRemoveProfilePhoto, MIN_PROFILE_PHOTOS } from '@/lib/profile-publication.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** Verifica se o usuário é dono do perfil e retorna photos. */
async function verifyProfileOwnership(
  profileId: string,
  token: string
): Promise<{ ok: boolean; photos?: string[]; status?: string }> {
  const res = await fetch(
    `${PB_URL}/api/collections/profiles/records/${profileId}?fields=id,user,photos,status`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return { ok: false }
  const record = (await res.json()) as { user?: string; photos?: string[]; status?: string }
  const userId = getUserIdFromToken(token)
  if (!userId || record.user !== userId) return { ok: false }
  return {
    ok: true,
    photos: Array.isArray(record.photos) ? record.photos : [],
    status: record.status,
  }
}

function extractPhotoId(urlOrId: string): string {
  if (!urlOrId) return ''
  const m = urlOrId.match(/([a-z0-9]{15})$/i)
  return m ? m[1] : urlOrId
}

/** DELETE: remove foto do perfil. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const { id: profileId, photoId: rawPhotoId } = await params
  if (!profileId || !rawPhotoId) {
    return Response.json({ error: 'ID do perfil e da foto obrigatórios' }, { status: 400 })
  }

  const photoId = extractPhotoId(rawPhotoId)

  const ownership = await verifyProfileOwnership(profileId, token)
  if (!ownership.ok) {
    return Response.json({ error: 'Perfil não encontrado ou sem permissão' }, { status: 404 })
  }

  const photos = ownership.photos || []
  if (!photos.includes(photoId)) {
    return Response.json({ error: 'Foto não encontrada no perfil' }, { status: 404 })
  }
  if (!canRemoveProfilePhoto(ownership.status || '', photos.length)) {
    return Response.json(
      {
        error: `Perfis publicados precisam manter pelo menos ${MIN_PROFILE_PHOTOS} fotos. Adicione outra foto antes de remover esta.`,
      },
      { status: 400 }
    )
  }

  const newPhotos = photos.filter((p) => extractPhotoId(p) !== photoId)

  try {
    const patchRes = await fetch(`${PB_URL}/api/collections/profiles/records/${profileId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ photos: newPhotos }),
    })

    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao atualizar perfil' },
        { status: patchRes.status }
      )
    }

    await fetch(`${PB_URL}/api/collections/files/records/${photoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: 'Erro ao remover foto' }, { status: 500 })
  }
}
