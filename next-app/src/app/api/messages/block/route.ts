import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** Ordena os dois IDs para chave única da conversa (user_a <= user_b). */
function blockKey(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a]
}

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** GET: verifica se a conversa está bloqueada. Query: otherUserId= */
export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const otherUserId = request.nextUrl.searchParams.get('otherUserId')
  if (!otherUserId) return Response.json({ error: 'otherUserId obrigatório' }, { status: 400 })

  const [userA, userB] = blockKey(userId, otherUserId)
  try {
    const filter = `user_a = "${userA}" && user_b = "${userB}"`
    const res = await fetch(
      `${PB_URL}/api/collections/message_blocks/records?perPage=1&filter=${encodeURIComponent(filter)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!res.ok) return Response.json({ blocked: false })
    const data = await res.json()
    const item = data.items?.[0] as { blocked?: boolean } | undefined
    return Response.json({ blocked: item?.blocked === true })
  } catch {
    return Response.json({ blocked: false })
  }
}

/** POST: bloquear ou desbloquear. Body: { otherUserId, block: boolean } */
export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const body = (await request.json()) as { otherUserId?: string; block?: boolean }
  const otherUserId = body?.otherUserId
  const block = body?.block === true
  if (!otherUserId) return Response.json({ error: 'otherUserId obrigatório' }, { status: 400 })

  const [userA, userB] = blockKey(userId, otherUserId)
  try {
    const filter = `user_a = "${userA}" && user_b = "${userB}"`
    const listRes = await fetch(
      `${PB_URL}/api/collections/message_blocks/records?perPage=1&filter=${encodeURIComponent(filter)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!listRes.ok) return Response.json({ error: 'Erro ao verificar bloqueio' }, { status: 500 })
    const listData = await listRes.json()
    const existing = listData.items?.[0] as { id?: string } | undefined

    if (existing) {
      const res = await fetch(
        `${PB_URL}/api/collections/message_blocks/records/${existing.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ blocked: block }),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return Response.json(
          { error: (err as { message?: string }).message || 'Erro ao atualizar' },
          { status: res.status }
        )
      }
      return Response.json({ blocked: block })
    }

    if (!block) return Response.json({ blocked: false })

    const createRes = await fetch(`${PB_URL}/api/collections/message_blocks/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_a: userA, user_b: userB, blocked: true }),
    })
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao bloquear' },
        { status: createRes.status }
      )
    }
    return Response.json({ blocked: true })
  } catch (e) {
    return Response.json({ error: 'Erro ao processar bloqueio' }, { status: 500 })
  }
}
