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
  const enabled = request.nextUrl.searchParams.get('enabled')

  let filter = ''
  if (enabled === 'true') filter = 'enabled = true'
  if (enabled === 'false') filter = 'enabled = false'

  try {
    const token = await getEffectiveToken(auth.token)
    const url = `${PB_URL}/api/collections/plans/records?page=${page}&perPage=${perPage}&sort=price_monthly${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return Response.json({ items: [], totalItems: 0, page, perPage })
    const data = await res.json()
    return Response.json({
      items: data.items || [],
      totalItems: data.totalItems ?? 0,
      page,
      perPage,
    })
  } catch {
    return Response.json({ items: [], totalItems: 0, page, perPage })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = (await request.json()) as Record<string, unknown>
    const token = await getEffectiveToken(auth.token)
    const res = await fetch(`${PB_URL}/api/collections/plans/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return Response.json(
        { error: (json as { message?: string }).message || 'Erro ao criar plano' },
        { status: res.status }
      )
    }
    return Response.json(json)
  } catch {
    return Response.json({ error: 'Erro ao criar plano' }, { status: 500 })
  }
}
