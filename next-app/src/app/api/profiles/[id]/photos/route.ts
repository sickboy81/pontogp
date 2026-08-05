import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { enforceUserRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'
import { imageFileToWebp, isRasterImageMime, resolveImageMime } from '@/lib/server/media-upload'
import { mapProfile } from '@/lib/api/profiles'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** Verifica se o usuário é dono do perfil. */
async function verifyProfileOwnership(
  profileId: string,
  token: string
): Promise<{ ok: boolean; photos?: string[] }> {
  const res = await fetch(
    `${PB_URL}/api/collections/profiles/records/${profileId}?fields=id,user,photos`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return { ok: false }
  const record = (await res.json()) as { user?: string; photos?: string[] }
  const userId = getUserIdFromToken(token)
  if (!userId || record.user !== userId) return { ok: false }
  return { ok: true, photos: Array.isArray(record.photos) ? record.photos : [] }
}

/** POST: adiciona foto ao perfil. Multipart/form-data com campo "file". */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })
  const limited = enforceUserRateLimit(request, 'photo-upload', userId, RATE_LIMIT_POLICIES.upload)
  if (limited) return limited

  const { id: profileId } = await params
  if (!profileId) return Response.json({ error: 'ID do perfil obrigatório' }, { status: 400 })

  const ownership = await verifyProfileOwnership(profileId, token)
  if (!ownership.ok) {
    return Response.json({ error: 'Perfil não encontrado ou sem permissão' }, { status: 404 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file || !(file instanceof Blob) || file.size === 0) {
      return Response.json({ error: 'Arquivo inválido ou vazio' }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return Response.json(
        { error: 'Arquivo muito grande. Máximo 5 MB.' },
        { status: 400 }
      )
    }

    const effectiveMime = resolveImageMime(file)
    if (!effectiveMime || !isRasterImageMime(effectiveMime)) {
      return Response.json(
        { error: 'Tipo não permitido. Envie uma imagem (JPG, PNG, WebP, HEIC, etc.).' },
        { status: 400 }
      )
    }

    let fileForPb: File
    try {
      fileForPb = await imageFileToWebp(file)
    } catch {
      return Response.json(
        { error: 'Não foi possível processar a imagem. Tente outro arquivo.' },
        { status: 400 }
      )
    }
    if (fileForPb.size > maxSize) {
      return Response.json(
        { error: 'Imagem otimizada ainda excede 5 MB. Use uma foto com resolução menor.' },
        { status: 400 }
      )
    }

    const pbFormData = new FormData()
    pbFormData.append('file', fileForPb)

    const createRes = await fetch(`${PB_URL}/api/collections/files/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: pbFormData,
    })

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      const msg = (err as { message?: string }).message || 'Erro ao enviar arquivo'
      return Response.json({ error: msg }, { status: createRes.status })
    }

    const fileRecord = (await createRes.json()) as { id: string }
    const newPhotos = [...(ownership.photos || []), fileRecord.id]

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

    const updated = (await patchRes.json()) as Record<string, unknown>
    const expandedRes = await fetch(
      `${PB_URL}/api/collections/profiles/records/${profileId}?expand=photos,videos,audio,plan`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (expandedRes.ok) {
      const expanded = (await expandedRes.json()) as Record<string, unknown> & {
        expand?: Record<string, unknown>
      }
      const mapped = mapProfile(expanded)
      if (mapped) return Response.json(mapped)
    }
    return Response.json(updated)
  } catch (e) {
    return Response.json({ error: 'Erro ao enviar foto' }, { status: 500 })
  }
}
