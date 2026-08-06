import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

async function getEffectiveToken(userToken: string): Promise<string> {
  const adminToken = await getAdminToken()
  return adminToken || userToken
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 30))
  const read = request.nextUrl.searchParams.get('read')

  let filter = ''
  if (read === 'true') filter = 'read = true'
  if (read === 'false') filter = 'read = false'

  try {
    const token = await getEffectiveToken(auth.token)
    const query = `page=${page}&perPage=${perPage}${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`
    let res = await fetch(`${PB_URL}/api/collections/contacts/records?${query}&sort=-created`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    // Older contacts schemas may reject sorting by the system timestamp.
    // The records are still useful without ordering, so retry the same query.
    if (res.status === 400) {
      res = await fetch(`${PB_URL}/api/collections/contacts/records?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
    }
    if (!res.ok) {
      const error = (await res.json().catch(() => ({}))) as { message?: string }
      return Response.json(
        { error: error.message || 'Não foi possível carregar os contatos.' },
        { status: res.status }
      )
    }
    const data = await res.json()
    return Response.json({
      items: data.items || [],
      totalItems: data.totalItems ?? 0,
      page,
      perPage,
    })
  } catch {
    return Response.json({ error: 'Não foi possível consultar os contatos agora.' }, { status: 502 })
  }
}
