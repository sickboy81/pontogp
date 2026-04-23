import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

async function verifyProfileOwnership(
  profileId: string,
  token: string
): Promise<{ ok: boolean; videos?: string[] }> {
  const res = await fetch(
    `${PB_URL}/api/collections/profiles/records/${profileId}?fields=id,user,videos`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return { ok: false }
  const record = (await res.json()) as { user?: string; videos?: string[] }
  const userId = getUserIdFromToken(token)
  if (!userId || record.user !== userId) return { ok: false }
  return { ok: true, videos: Array.isArray(record.videos) ? record.videos : [] }
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

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: 'Tipo não permitido. Use MP4 ou WebM.' },
        { status: 400 }
      )
    }

    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return Response.json(
        { error: 'Arquivo muito grande. Máximo 100 MB.' },
        { status: 400 }
      )
    }

    const pbFormData = new FormData()
    pbFormData.append('file', file)

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
