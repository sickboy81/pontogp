import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { imageFileToWebp, isRasterImageMime, resolveImageMime } from '@/lib/server/media-upload'
import { buildVerificationPayload } from '@/lib/verification-payload.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const MAX_STORED_FILE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_INPUT_SIZE = 15 * 1024 * 1024

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
    const fullName = formData.get('full_name') as string | null
    const documentType = formData.get('document_type') as string | null
    const termsAccepted = formData.get('terms_accepted') === 'true'
    const docFront = formData.get('document_front') as File | null
    const docBack = formData.get('document_back') as File | null
    const selfie = formData.get('selfie') as File | null

    if (!profileId) return Response.json({ error: 'profileId obrigatório' }, { status: 400 })
    if (!fullName?.trim()) return Response.json({ error: 'Informe seu nome completo conforme o documento.' }, { status: 400 })
    if (!termsAccepted) return Response.json({ error: 'Aceite os termos para enviar a solicitação.' }, { status: 400 })

    const files = [docFront, docBack, selfie].filter((f) => f && f instanceof Blob && f.size > 0)
    if (files.length < 3) {
      return Response.json(
        { error: 'Envie documento frente, verso e selfie' },
        { status: 400 }
      )
    }

    for (const f of [docFront, docBack, selfie]) {
      if (!f) continue
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      const maxInputSize = isPdf ? MAX_STORED_FILE_SIZE : MAX_IMAGE_INPUT_SIZE
      if (f.size > maxInputSize) {
        return Response.json(
          {
            error: isPdf
              ? 'Cada PDF deve ter no máximo 5 MB.'
              : 'Cada imagem deve ter no máximo 15 MB para ser otimizada.',
          },
          { status: 400 }
        )
      }
    }

    async function docFileForPb(f: File): Promise<File> {
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      if (isPdf) return f
      const mime = resolveImageMime(f)
      if (!mime || !isRasterImageMime(mime)) {
        throw new Error('INVALID_DOC')
      }
      const webp = await imageFileToWebp(f)
      if (webp.size > MAX_STORED_FILE_SIZE) {
        throw new Error('TOO_LARGE')
      }
      return webp
    }

    let frontOut: File
    let backOut: File
    let selfieOut: File
    try {
      frontOut = await docFileForPb(docFront as File)
      backOut = await docFileForPb(docBack as File)
      selfieOut = await docFileForPb(selfie as File)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'INVALID_DOC') {
        return Response.json(
          { error: 'Documentos e selfie devem ser imagens (ou PDF nos documentos).' },
          { status: 400 }
        )
      }
      if (msg === 'TOO_LARGE') {
        return Response.json(
          { error: 'Imagem otimizada excede 5 MB. Envie foto com resolução menor.' },
          { status: 400 }
        )
      }
      return Response.json({ error: 'Não foi possível processar os arquivos.' }, { status: 400 })
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
    const verificationPayload = buildVerificationPayload({ profileId, userId, fullName, documentType, termsAccepted })
    for (const [key, value] of Object.entries(verificationPayload)) pbForm.append(key, value)
    pbForm.append('document_front', frontOut)
    pbForm.append('document_back', backOut)
    pbForm.append('selfie', selfieOut)

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
    const detail = e instanceof Error ? e.message : String(e)
    console.error('[verification] POST error:', e)
    return Response.json({ error: 'Erro ao enviar solicitação', detail }, { status: 500 })
  }
}
