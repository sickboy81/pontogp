import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { getResendTransactionalConfig } from '@/lib/resend-email.mjs'
import { buildEmailHistoryQuery, getEmailHistoryFailure } from '@/lib/email-history.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const COLLECTION = process.env.EMAIL_LOGS_COLLECTION || 'email_delivery_logs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 20))
  const template = request.nextUrl.searchParams.get('template')?.trim() || ''
  const status = request.nextUrl.searchParams.get('status')?.trim() || ''
  const token = (await getAdminToken()) || auth.token
  try {
    const query = buildEmailHistoryQuery({ page, perPage, template, status })
    const response = await fetch(`${PB_URL}/api/collections/${COLLECTION}/records?${query}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (!response.ok) return Response.json({ ...getEmailHistoryFailure(response.status), items: [], totalItems: 0, resendConfigured: Boolean(getResendTransactionalConfig()) }, { status: response.status === 404 ? 503 : 502 })
    const data = await response.json()
    return Response.json({ items: data.items || [], totalItems: data.totalItems || 0, page, perPage, configured: true, resendConfigured: Boolean(getResendTransactionalConfig()) })
  } catch {
    return Response.json({ ...getEmailHistoryFailure(500), items: [], totalItems: 0, resendConfigured: Boolean(getResendTransactionalConfig()) }, { status: 502 })
  }
}
