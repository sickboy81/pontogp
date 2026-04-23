import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

function toPBDate(d: Date = new Date()) {
  return d.toISOString().replace('T', ' ')
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

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'Tipo não permitido. Use imagem ou vídeo.' }, { status: 400 })
    }

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return Response.json({ error: 'Arquivo muito grande. Máximo 50 MB.' }, { status: 400 })
    }

    const expiresAt = toPBDate(new Date(Date.now() + 12 * 60 * 60 * 1000))

    const pbForm = new FormData()
    pbForm.append('profile', profileId)
    pbForm.append('file', file)
    pbForm.append('expires_at', expiresAt)
    pbForm.append('type', file.type.startsWith('video/') ? 'video' : 'image')
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
