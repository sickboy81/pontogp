import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** GET: verifica se usuário tem solicitação de verificação pendente (por profileId) */
export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const profileId = request.nextUrl.searchParams.get('profileId')
  if (!profileId) return Response.json({ error: 'profileId obrigatório' }, { status: 400 })

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/verification_requests/records?filter=${encodeURIComponent(`profile = "${profileId}"`)}&perPage=1&sort=-created`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return Response.json(null)
    const data = await res.json()
    const items = data.items || []
    const latest = items[0]
    if (!latest) return Response.json(null)
    return Response.json({
      id: latest.id,
      status: latest.status,
      profile: latest.profile,
    })
  } catch {
    return Response.json(null)
  }
}

/** POST: envia solicitação de verificação. Multipart: document_front, document_back, selfie, profileId */
export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  try {
    const formData = await request.formData()
    const profileId = formData.get('profileId') as string | null
    const docFront = formData.get('document_front') as File | null
    const docBack = formData.get('document_back') as File | null
    const selfie = formData.get('selfie') as File | null

    if (!profileId) return Response.json({ error: 'profileId obrigatório' }, { status: 400 })

    const files = [docFront, docBack, selfie].filter((f) => f && f instanceof Blob && f.size > 0)
    if (files.length < 3) {
      return Response.json(
        { error: 'Envie documento frente, verso e selfie' },
        { status: 400 }
      )
    }

    const res = await fetch(
      `${PB_URL}/api/collections/profiles/records/${profileId}?fields=id,user`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return Response.json({ error: 'Perfil não encontrado' }, { status: 404 })
    const profile = (await res.json()) as { user?: string }
    if (profile.user !== userId) {
      return Response.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const pbForm = new FormData()
    pbForm.append('profile', profileId)
    pbForm.append('user', userId)
    pbForm.append('status', 'pending')
    pbForm.append('document_front', docFront as File)
    pbForm.append('document_back', docBack as File)
    pbForm.append('selfie', selfie as File)

    const createRes = await fetch(`${PB_URL}/api/collections/verification_requests/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: pbForm,
    })

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao enviar' },
        { status: createRes.status }
      )
    }

    const created = await createRes.json()
    return Response.json(created)
  } catch (e) {
    return Response.json({ error: 'Erro ao enviar solicitação' }, { status: 500 })
  }
}
