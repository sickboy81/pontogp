import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  return Response.json(
    { authenticated: Boolean(auth) },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}
