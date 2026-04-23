import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: lista solicitações de verificação (apenas admin). Query: status=pending|all */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const status = request.nextUrl.searchParams.get('status') || 'pending'
  const filter = status === 'all' ? '' : 'status = "pending"'

  try {
    const url = `${PB_URL}/api/collections/verification_requests/records?perPage=50&sort=-created${filter ? `&filter=${encodeURIComponent(filter)}` : ''}&expand=profile,user&fields=id,profile,user,status,created,document_front,document_back,selfie,expand`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: 'no-store',
    })
    if (!res.ok) return Response.json({ items: [] })
    const data = await res.json()
    const items = (data.items || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      profile: r.profile,
      user: r.user,
      status: r.status,
      created: r.created,
      expand: r.expand,
    }))
    return Response.json({ items })
  } catch {
    return Response.json({ items: [] })
  }
}
