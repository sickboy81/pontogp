import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const GROUP_ROLES: Record<string, string[]> = {
  users: ['user'],
  advertisers: ['advertiser'],
  admins: ['admin', 'administrator', '1'],
}

export const dynamic = 'force-dynamic'

/** GET: lista usuários (apenas admin). A lista é sempre limitada ao grupo selecionado. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 20))
  const q = (request.nextUrl.searchParams.get('q') || '').trim()
  const group = request.nextUrl.searchParams.get('group') || 'users'
  const status = request.nextUrl.searchParams.get('status') || ''
  const verified = request.nextUrl.searchParams.get('verified') || ''
  const documentVerified = request.nextUrl.searchParams.get('documentVerified') || ''
  const summary = request.nextUrl.searchParams.get('summary') === '1'
  const token = (await getAdminToken()) || auth.token

  const roles = GROUP_ROLES[group] || GROUP_ROLES.users
  let filter = `(${roles.map((role) => `role = "${role}"`).join(' || ')})`
  if (status) filter += ` && status = "${status}"`
  if (verified === 'yes') filter += ' && verified = true'
  if (verified === 'no') filter += ' && verified = false'
  if (documentVerified === 'yes') filter += ' && document_verified = true'
  if (documentVerified === 'no') filter += ' && document_verified = false'
  if (q.length >= 2) {
    const esc = q.replace(/"/g, '\\"')
    filter = `(${filter}) && (email ~ "${esc}" || name ~ "${esc}")`
  }

  try {
    const base = `${PB_URL}/api/collections/users/records?page=${summary ? 1 : page}&perPage=${summary ? 1 : perPage}&sort=-created`
    const url = `${base}&filter=${encodeURIComponent(filter)}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return Response.json({ items: [], totalItems: 0 })
    const data = await res.json()
    const items = (data.items || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      status: r.status,
      verified: r.verified,
      document_verified: r.document_verified,
      created: r.created,
    }))
    return Response.json({
      items,
      totalItems: data.totalItems ?? items.length,
      page: summary ? 1 : page,
      perPage,
    })
  } catch {
    return Response.json({ items: [], totalItems: 0 })
  }
}
