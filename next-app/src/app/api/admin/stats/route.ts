import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

async function fetchCount(
  token: string,
  collection: string,
  filter = ''
): Promise<number> {
  try {
    const url = `${PB_URL}/api/collections/${collection}/records?perPage=1&fields=id${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return 0
    const data = await res.json()
    return data.totalItems ?? 0
  } catch {
    return 0
  }
}

async function fetchRevenue(token: string): Promise<number> {
  try {
    const baseUrl = `${PB_URL}/api/collections/payments/records?perPage=200&page=1&fields=amount&filter=${encodeURIComponent('status = "paid"')}`
    const firstRes = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!firstRes.ok) return 0
    const firstData = await firstRes.json()
    const firstItems = Array.isArray(firstData.items) ? firstData.items : []
    let total = firstItems.reduce((acc: number, item: Record<string, unknown>) => acc + (Number(item.amount) || 0), 0)

    const totalPages = Math.min(Number(firstData.totalPages) || 1, 10)
    for (let page = 2; page <= totalPages; page += 1) {
      const pageRes = await fetch(
        `${PB_URL}/api/collections/payments/records?perPage=200&page=${page}&fields=amount&filter=${encodeURIComponent('status = "paid"')}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }
      )
      if (!pageRes.ok) break
      const pageData = await pageRes.json()
      const pageItems = Array.isArray(pageData.items) ? pageData.items : []
      total += pageItems.reduce((acc: number, item: Record<string, unknown>) => acc + (Number(item.amount) || 0), 0)
    }
    return total
  } catch {
    return 0
  }
}

/** GET: estatísticas do painel (apenas admin). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const token = (await getAdminToken()) || auth.token

    const [totalUsers, totalProfiles, pendingReports, unreadMessages, pendingVerifications, unreadContacts, activeSubscriptions, totalRevenue] =
      await Promise.all([
        fetchCount(token, 'users'),
        fetchCount(token, 'profiles'),
        fetchCount(token, 'reports', 'status = "pending"'),
        fetchCount(token, 'messages', 'read = false'),
        fetchCount(token, 'verification_requests', 'status = "pending"'),
        fetchCount(token, 'contacts', 'read = false'),
        fetchCount(token, 'subscriptions', 'status = "active"'),
        fetchRevenue(token),
      ])
    return Response.json({
      totalUsers,
      totalProfiles,
      pendingReports,
      unreadMessages,
      pendingVerifications,
      unreadContacts,
      activeSubscriptions,
      totalRevenue,
    })
  } catch {
    return Response.json(
      {
        totalUsers: 0,
        totalProfiles: 0,
        pendingReports: 0,
        unreadMessages: 0,
        pendingVerifications: 0,
        unreadContacts: 0,
        activeSubscriptions: 0,
        totalRevenue: 0,
      }
    )
  }
}
