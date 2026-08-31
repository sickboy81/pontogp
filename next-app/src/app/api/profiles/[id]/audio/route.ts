import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { enforceUserRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'
import { maybeAudioToCompactM4a, pocketbaseAcceptsAudioMime, resolveAudioMime } from '@/lib/server/media-upload'
import { canAddMedia } from '@/lib/plan-entitlements.mjs'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { authorizeProfileOwner } from '@/lib/profile-owner-record.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'
export const maxDuration = 180

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

async function loadPlan(planRef?: string) {
  if (!planRef) return null
  const byId = await fetch(`${PB_URL}/api/collections/plans/records/${planRef}`, { cache: 'no-store' })
  if (byId.ok) return await byId.json()
  const bySlug = await fetch(`${PB_URL}/api/collections/plans/records?filter=${encodeURIComponent(`slug="${planRef.replace(/"/g, '\\"')}"`)}&perPage=1`, { cache: 'no-store' })
  if (!bySlug.ok) return null
  return (await bySlug.json()).items?.[0] || null
}

/** POST: adiciona ou substitui áudio do perfil. Multipart/form-data com campo "file". */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })
  const limited = enforceUserRateLimit(request, 'audio-upload', userId, RATE_LIMIT_POLICIES.upload)
  if (limited) return limited

  const { id: profileId } = await params
  if (!profileId) return Response.json({ error: 'ID do perfil obrigatório' }, { status: 400 })

  const authorization = await authorizeProfileOwner({
    pbUrl: PB_URL,
    profileId,
    sessionToken: token,
    fields: 'id,user,plan',
    getAdminTokenImpl: getAdminToken,
  })
  if (!authorization.ok) return Response.json({ error: authorization.error }, { status: authorization.status })
  const ownership = authorization.profile as { plan?: string }

  const plan = await loadPlan(ownership.plan)
  if (!canAddMedia(plan, 'audio', 0)) {
    return Response.json({ error: 'Seu plano não permite áudio.' }, { status: 400 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file || !(file instanceof Blob) || file.size === 0) {
      return Response.json({ error: 'Arquivo inválido ou vazio' }, { status: 400 })
    }

    const effectiveMime = resolveAudioMime(file)
    if (!effectiveMime || !effectiveMime.startsWith('audio/')) {
      return Response.json(
        { error: 'Tipo não permitido. Envie um arquivo de áudio (MP3, M4A, WAV, OGG, etc.).' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return Response.json(
        { error: 'Arquivo muito grande. Máximo 10 MB.' },
        { status: 400 }
      )
    }

    const fileForPb = await maybeAudioToCompactM4a(file)
    const outMime = (fileForPb.type || resolveAudioMime(fileForPb) || '').toLowerCase()
    if (!pocketbaseAcceptsAudioMime(outMime)) {
      return Response.json(
        {
          error:
            'Não foi possível preparar o áudio para envio. Use MP3 ou M4A, ou configure ffmpeg no servidor (FFMPEG_PATH).',
        },
        { status: 400 }
      )
    }
    if (fileForPb.size > maxSize) {
      return Response.json(
        { error: 'Áudio após compactação ainda excede 10 MB.' },
        { status: 400 }
      )
    }

    const pbFormData = new FormData()
    const normalizedFile =
      outMime === 'audio/mpeg' || outMime === 'audio/mp3'
        ? new File([fileForPb], fileForPb.name.replace(/\.[^.]+$/, '') + '.mp3', { type: 'audio/mpeg' })
        : fileForPb
    pbFormData.append('file', normalizedFile)

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

    const patchRes = await fetch(`${PB_URL}/api/collections/profiles/records/${profileId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ audio: fileRecord.id }),
    })

    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao atualizar perfil' },
        { status: patchRes.status }
      )
    }

    const updated = (await patchRes.json()) as Record<string, unknown>
    return Response.json(updated)
  } catch (e) {
    return Response.json({ error: 'Erro ao enviar áudio' }, { status: 500 })
  }
}

/** DELETE: remove áudio do perfil. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(_request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const { id: profileId } = await params
  if (!profileId) return Response.json({ error: 'ID do perfil obrigatório' }, { status: 400 })

  const authorization = await authorizeProfileOwner({
    pbUrl: PB_URL,
    profileId,
    sessionToken: token,
    fields: 'id,user,plan',
    getAdminTokenImpl: getAdminToken,
  })
  if (!authorization.ok) return Response.json({ error: authorization.error }, { status: authorization.status })

  try {
    const patchRes = await fetch(`${PB_URL}/api/collections/profiles/records/${profileId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ audio: null }),
    })

    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao atualizar perfil' },
        { status: patchRes.status }
      )
    }

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: 'Erro ao remover áudio' }, { status: 500 })
  }
}
