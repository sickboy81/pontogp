import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { getAdminProfileStatus } from '@/lib/admin-profile-status.mjs'
import { ADVERTISER_PROFILE_OWNER_FILTER, filterAdvertiserProfiles } from '@/lib/advertiser-profile-access.mjs'

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
      `${PB_URL}/api/collections/profiles/records?page=${page}&perPage=${perPage}&sort=-created&filter=${encodeURIComponent(ADVERTISER_PROFILE_OWNER_FILTER)}&expand=user,photos&fields=id,user,name,city,state,category,plan,status,verified,created,bio,whatsapp,telegram,phone,show_whatsapp,show_telegram,show_phone,expand.user.id,expand.user.role,expand.user.email,expand.photos.id,expand.photos.file,expand.photos.collectionId`,
      {
        headers: { Authorization: `Bearer ${(await getAdminToken()) || auth.token}` },
        cache: 'no-store',
      }
    )
    if (!res.ok) return Response.json({ items: [], totalItems: 0 })
    const data = await res.json()
    const rawItems = filterAdvertiserProfiles(data.items || []) as Record<string, unknown>[]
    const items = rawItems.map((r: Record<string, unknown>) => {
      const expand = r.expand as Record<string, unknown> | undefined
      const photos = expand?.photos as Array<{ collectionId?: string; id?: string; file?: string }> | undefined
      const firstPhoto = Array.isArray(photos) && photos.length > 0 ? photos[0] : undefined
      const thumbnail = firstPhoto?.file
        ? `${PB_URL}/api/files/${firstPhoto.collectionId}/${firstPhoto.id}/${firstPhoto.file}?thumb=200x300`
        : undefined
      const publication = getAdminProfileStatus({ ...r, photoCount: Array.isArray(photos) ? photos.length : 0 })
      return {
        id: r.id,
        user_id: r.user,
        owner_role: (expand?.user as Record<string, unknown> | undefined)?.role,
        owner_email: (expand?.user as Record<string, unknown> | undefined)?.email,
        name: r.name,
        city: r.city,
        state: r.state,
        category: r.category,
        plan: r.plan,
        status: r.status,
        verified: r.verified,
        created: r.created,
        thumbnail,
        publication_label: publication.label,
        publication_tone: publication.tone,
        publication_reasons: publication.reasons,
      }
    })
    return Response.json({
      items,
      totalItems: rawItems.length === (data.items || []).length ? (data.totalItems ?? items.length) : items.length,
      page,
      perPage,
    })
  } catch {
    return Response.json({ items: [], totalItems: 0 })
  }
}
