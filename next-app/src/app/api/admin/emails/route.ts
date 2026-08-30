import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { getResendTransactionalConfig } from '@/lib/resend-email.mjs'

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
    const filters = [template ? `template = "${template.replaceAll('"', '\\"')}"` : '', status ? `status = "${status.replaceAll('"', '\\"')}"` : ''].filter(Boolean)
    const filterQuery = filters.length ? `&filter=${encodeURIComponent(filters.join(' && '))}` : ''
    const response = await fetch(`${PB_URL}/api/collections/${COLLECTION}/records?page=${page}&perPage=${perPage}&sort=-created${filterQuery}&expand=profile,sender_admin&fields=id,template,recipient_email,subject,status,provider_id,error,created,expand.profile.name,expand.sender_admin.email`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (!response.ok) return Response.json({ items: [], totalItems: 0, configured: response.status !== 404, resendConfigured: Boolean(getResendTransactionalConfig()) })
    const data = await response.json()
    return Response.json({ items: data.items || [], totalItems: data.totalItems || 0, page, perPage, configured: true, resendConfigured: Boolean(getResendTransactionalConfig()) })
  } catch {
    return Response.json({ items: [], totalItems: 0, configured: false, resendConfigured: Boolean(getResendTransactionalConfig()) })
  }
}
