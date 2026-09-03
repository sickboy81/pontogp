import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { getDocumentVerificationState } from '@/lib/verification-document-status.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const GROUP_ROLES: Record<string, string[]> = {
  users: ['user'],
  advertisers: ['advertiser'],
  admins: ['admin', 'administrator', '1'],
}

export const dynamic = 'force-dynamic'

type DocumentReview = { user?: string; status?: string; reviewed_at?: string; created?: string }

async function getDocumentReviewsByUser(token: string, userIds: string[]) {
  const reviews = new Map<string, DocumentReview[]>()
  if (userIds.length === 0) return reviews

  try {
    const userFilter = userIds.map((id) => `user = "${id}"`).join(' || ')
    const filter = `(${userFilter}) && (status = "approved" || status = "rejected")`
    const response = await fetch(
      `${PB_URL}/api/collections/verification_requests/records?perPage=500&filter=${encodeURIComponent(filter)}&fields=user,status,reviewed_at,created`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!response.ok) return reviews

    const data = (await response.json()) as { items?: DocumentReview[] }
    for (const review of data.items || []) {
      if (!review.user) continue
      const items = reviews.get(review.user) || []
      items.push(review)
      reviews.set(review.user, items)
    }
  } catch {
    // A lista de contas continua disponível usando a marcação legada como fallback.
  }
  return reviews
}

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
    const reviewsByUser = await getDocumentReviewsByUser(token, (data.items || []).map((item: Record<string, unknown>) => String(item.id || '')).filter(Boolean))
    const items = (data.items || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      display_name: r.display_name || r.name,
      plan: r.plan || 'gratis',
      role: r.role,
      status: r.status,
      verified: r.verified,
      document_verified: getDocumentVerificationState(r.document_verified === true, reviewsByUser.get(String(r.id || '')) || []),
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
