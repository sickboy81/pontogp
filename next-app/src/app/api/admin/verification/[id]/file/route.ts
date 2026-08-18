import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { isVerificationFileField } from '@/lib/verification-file.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: entrega um arquivo de verificação somente para um admin autenticado. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request)
  if (!auth) return new Response('Não autorizado', { status: 401 })

  const { id } = await params
  const field = request.nextUrl.searchParams.get('field') || ''
  if (!id || !isVerificationFileField(field)) {
    return new Response('Arquivo inválido', { status: 400 })
  }

  try {
    const recordRes = await fetch(
      `${PB_URL}/api/collections/verification_requests/records/${encodeURIComponent(id)}?fields=${field}`,
      { headers: { Authorization: `Bearer ${auth.token}` }, cache: 'no-store' },
    )
    if (!recordRes.ok) return new Response('Solicitação não encontrada', { status: recordRes.status })

    const record = (await recordRes.json()) as Record<string, unknown>
    const filename = typeof record[field] === 'string' ? record[field] : ''
    if (!filename) return new Response('Arquivo não encontrado', { status: 404 })

    const fileRes = await fetch(
      `${PB_URL}/api/files/verification_requests/${encodeURIComponent(id)}/${encodeURIComponent(filename)}`,
      { headers: { Authorization: `Bearer ${auth.token}` }, cache: 'no-store' },
    )
    if (!fileRes.ok || !fileRes.body) return new Response('Arquivo não encontrado', { status: fileRes.status || 404 })

    return new Response(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': fileRes.headers.get('content-type') || 'application/octet-stream',
        'Content-Length': fileRes.headers.get('content-length') || '',
        'Cache-Control': 'private, no-store',
        'Content-Disposition': 'inline',
      },
    })
  } catch {
    return new Response('Erro ao carregar arquivo', { status: 502 })
  }
}
