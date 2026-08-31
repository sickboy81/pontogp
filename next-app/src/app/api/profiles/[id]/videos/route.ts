import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { enforceUserRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'
import { maybeVideoToCompactMp4, resolveVideoMime } from '@/lib/server/media-upload'
import { canAddMedia } from '@/lib/plan-entitlements.mjs'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { authorizeProfileOwner } from '@/lib/profile-owner-record.mjs'

export const maxDuration = 300

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

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

/** POST: adiciona vídeo ao perfil. Multipart/form-data com campo "file". */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })
  const limited = enforceUserRateLimit(request, 'video-upload', userId, RATE_LIMIT_POLICIES.upload)
  if (limited) return limited

  const { id: profileId } = await params
  if (!profileId) return Response.json({ error: 'ID do perfil obrigatório' }, { status: 400 })

  const authorization = await authorizeProfileOwner({
    pbUrl: PB_URL,
    profileId,
    sessionToken: token,
    fields: 'id,user,videos,plan',
    getAdminTokenImpl: getAdminToken,
  })
  if (!authorization.ok) return Response.json({ error: authorization.error }, { status: authorization.status })
  const ownership = authorization.profile as { videos?: string[]; plan?: string }

  const plan = await loadPlan(ownership.plan)
  if (!canAddMedia(plan, 'videos', ownership.videos?.length || 0)) {
    return Response.json({ error: 'Seu plano não permite mais vídeos.' }, { status: 400 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file || !(file instanceof Blob) || file.size === 0) {
      return Response.json({ error: 'Arquivo inválido ou vazio' }, { status: 400 })
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
    const effectiveMime = resolveVideoMime(file)
    if (!effectiveMime || !allowedTypes.includes(effectiveMime)) {
      return Response.json(
        { error: 'Tipo não permitido. Use MP4, WebM, MOV ou MKV.' },
        { status: 400 }
      )
    }

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return Response.json(
        { error: 'Arquivo muito grande. Máximo 50 MB.' },
        { status: 400 }
      )
    }

    const fileForPb = await maybeVideoToCompactMp4(file)
    if (fileForPb.size > maxSize) {
      return Response.json(
        { error: 'Vídeo após compressão ainda excede 50 MB.' },
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
    const newVideos = [...(ownership.videos || []), fileRecord.id]

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

    const updated = (await patchRes.json()) as Record<string, unknown>
    return Response.json(updated)
  } catch (e) {
    return Response.json({ error: 'Erro ao enviar vídeo' }, { status: 500 })
  }
}
