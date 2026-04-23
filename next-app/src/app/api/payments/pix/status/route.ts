import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'

const PIXGO_URL = 'https://pixgo.org/api/v1'
const PIXGO_API_KEY = process.env.PIXGO_API_KEY

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** GET: consulta status do PIX. Query: payment_id (payment_id retornado pelo create) */
export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const paymentId = request.nextUrl.searchParams.get('payment_id') ?? request.nextUrl.searchParams.get('reference')
  if (!paymentId) {
    return Response.json({ error: 'payment_id obrigatório' }, { status: 400 })
  }

  if (!PIXGO_API_KEY || PIXGO_API_KEY.length < 32) {
    return Response.json({ error: 'PIX não configurado' }, { status: 503 })
  }

  try {
    const res = await fetch(`${PIXGO_URL}/payment/${paymentId}/status`, {
      headers: { 'X-API-Key': PIXGO_API_KEY },
    })
    const json = (await res.json()) as {
      success?: boolean
      data?: { status: string }
      message?: string
    }

    if (!res.ok || !json.success) {
      return Response.json({ status: 'erro', error: json.message }, { status: 200 })
    }

    const status = (json.data?.status || 'pending').toLowerCase()
    return Response.json({ status })
  } catch (e) {
    return Response.json({ status: 'erro', error: 'Erro ao consultar' }, { status: 500 })
  }
}
