import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: lista perfis (apenas admin). Query: page=1, perPage=20. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const perPage = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('perPage')) || 20))

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/profiles/records?page=${page}&perPage=${perPage}&sort=-created&expand=photos`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
        cache: 'no-store',
      }
    )
    if (!res.ok) return Response.json({ items: [], totalItems: 0 })
    const data = await res.json()
    const items = (data.items || []).map((r: Record<string, unknown>) => {
      const expand = r.expand as Record<string, unknown> | undefined
      const photos = expand?.photos as Array<{ collectionId?: string; id?: string; file?: string }> | undefined
      const firstPhoto = Array.isArray(photos) && photos.length > 0 ? photos[0] : undefined
      const thumbnail = firstPhoto?.file
        ? `${PB_URL}/api/files/${firstPhoto.collectionId}/${firstPhoto.id}/${firstPhoto.file}?thumb=200x300`
        : undefined
      return {
        id: r.id,
        name: r.name,
        city: r.city,
        state: r.state,
        category: r.category,
        plan: r.plan,
        status: r.status,
        verified: r.verified,
        created: r.created,
        thumbnail,
      }
    })
    return Response.json({
      items,
      totalItems: data.totalItems ?? items.length,
      page,
      perPage,
    })
  } catch {
    return Response.json({ items: [], totalItems: 0 })
  }
}
