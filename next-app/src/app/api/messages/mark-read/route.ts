import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader } from '@/lib/auth-cookie'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** POST: marca mensagens como lidas. Body: { ids: string[] } */
export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const ids = Array.isArray(body?.ids) ? (body.ids as string[]) : []
    if (ids.length === 0) return Response.json({ ok: true })

    await Promise.all(
      ids.map((id) =>
        fetch(`${PB_URL}/api/collections/messages/records/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ read: true }),
        })
      )
    )
    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: true })
  }
}
