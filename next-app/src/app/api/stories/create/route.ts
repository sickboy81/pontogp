import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import {
  imageFileToWebp,
  isRasterImageMime,
  maybeVideoToCompactMp4,
} from '@/lib/server/media-upload'

export const maxDuration = 300

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

function toPBDate(d: Date = new Date()) {
  return d.toISOString().replace('T', ' ')
}

/** MIME confiável: muitos browsers/OS enviam type vazio ou application/octet-stream. */
function resolveStoryMime(file: File): string | null {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  const fromExt: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
  }
  const t = (file.type || '').trim().toLowerCase()
  if (
    t &&
    t !== 'application/octet-stream' &&
    t !== 'application/x-msdownload'
  ) {
    return t
  }
  return fromExt[ext] || null
}

/** POST: cria story. Multipart: file, profileId, text? */
export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const profileId = formData.get('profileId') as string | null
    const text = (formData.get('text') as string) || ''

    if (!file || !(file instanceof Blob) || file.size === 0) {
      return Response.json({ error: 'Arquivo obrigatório' }, { status: 400 })
    }
    if (!profileId) {
      return Response.json({ error: 'profileId obrigatório' }, { status: 400 })
    }

    const res = await fetch(
      `${PB_URL}/api/collections/profiles/records/${profileId}?fields=id,user`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return Response.json({ error: 'Perfil não encontrado' }, { status: 404 })
    const profile = (await res.json()) as { user?: string }
    if (profile.user !== userId) {
      return Response.json({ error: 'Sem permissão para criar story neste perfil' }, { status: 403 })
    }

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ]
    const effectiveMime = resolveStoryMime(file)
    if (!effectiveMime || !allowedTypes.includes(effectiveMime)) {
      return Response.json(
        {
          error:
            'Formato não suportado. Use JPG, PNG, WebP, MP4, WebM ou MOV (até 50 MB).',
        },
        { status: 400 }
      )
    }

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return Response.json({ error: 'Arquivo muito grande. Máximo 50 MB.' }, { status: 400 })
    }

    let fileForPb: File
    let storyType: 'image' | 'video'
    if (effectiveMime.startsWith('video/')) {
      fileForPb = await maybeVideoToCompactMp4(file)
      storyType = 'video'
    } else {
      if (!isRasterImageMime(effectiveMime)) {
        return Response.json({ error: 'Formato de imagem inválido.' }, { status: 400 })
      }
      try {
        fileForPb = await imageFileToWebp(file)
      } catch {
        return Response.json(
          { error: 'Não foi possível processar a imagem. Tente outro arquivo.' },
          { status: 400 }
        )
      }
      storyType = 'image'
    }
    if (fileForPb.size > maxSize) {
      return Response.json(
        { error: 'Arquivo após otimização ainda excede 50 MB.' },
        { status: 400 }
      )
    }

    const expiresAt = toPBDate(new Date(Date.now() + 12 * 60 * 60 * 1000))

    const pbForm = new FormData()
    pbForm.append('profile', profileId)
    pbForm.append('file', fileForPb)
    pbForm.append('expires_at', expiresAt)
    pbForm.append('type', storyType)
    pbForm.append('views', '0')
    if (text) pbForm.append('text', text)

    const createRes = await fetch(`${PB_URL}/api/collections/stories/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: pbForm,
    })

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao criar story' },
        { status: createRes.status }
      )
    }

    const created = await createRes.json()
    const fileField = created.file
    const fileUrl = fileField
      ? `${PB_URL}/api/files/stories/${created.id}/${fileField}`
      : ''
    return Response.json({
      ...created,
      file: fileUrl,
    })
  } catch (e) {
    return Response.json({ error: 'Erro ao criar story' }, { status: 500 })
  }
}
