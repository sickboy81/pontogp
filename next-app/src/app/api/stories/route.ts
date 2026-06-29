import { NextRequest } from 'next/server'
import { getLegacyCerejaStoryCutoff } from '@/lib/cereja-stories.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const CACHE_CONTROL = 'public, max-age=15, s-maxage=20, stale-while-revalidate=60'

export const dynamic = 'force-dynamic'

function toPBDate(d: Date = new Date()) {
  return d.toISOString().replace('T', ' ')
}

/** GET: lista stories ativas (não expiradas). Query: profileId (opcional) */
export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get('profileId')
  const now = toPBDate()
  const legacyCutoff = toPBDate(getLegacyCerejaStoryCutoff())

  const parts = [`(expires_at > "${now}" || (expires_at = "" && created > "${legacyCutoff}"))`]
  if (profileId) parts.push(`profile = "${profileId}"`)
  const filter = parts.join(' && ')

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/stories/records?filter=${encodeURIComponent(filter)}&perPage=100&sort=-created&expand=profile,profile.photos`,
      { next: { revalidate: 20 } }
    )
    if (!res.ok) {
      return Response.json([], {
        headers: { 'Cache-Control': CACHE_CONTROL },
      })
    }
    const data = await res.json()
    const items = (data.items || []).map((r: Record<string, unknown>) => {
      const expand = r.expand as Record<string, unknown> | undefined
      const profile = expand?.profile as Record<string, unknown> | undefined
      const file = r.file as string | undefined
      const fileUrl = file
        ? `${PB_URL}/api/files/stories/${r.id}/${file}`
        : ''
      const profileInnerExpand = (profile?.expand ?? {}) as {
        photos?: Array<{ file: string; collectionId: string; id: string }>
      }
      const profilePhotos = profileInnerExpand.photos
      let thumbnail = (profile?.thumbnail as string) || ''
      if (!thumbnail && profilePhotos?.[0]) {
        const p = profilePhotos[0]
        thumbnail = `${PB_URL}/api/files/${p.collectionId}/${p.id}/${p.file}?thumb=100x100`
      }
      if (!thumbnail && r.type === 'image') thumbnail = fileUrl
      return {
        id: r.id,
        profile: profile ? { id: profile.id, name: profile.name, thumbnail } : null,
        file: fileUrl,
        type: r.type || 'image',
        text: r.text || '',
        created: (r.created as string) || (r.updated as string) || '',
        expires_at: r.expires_at,
      }
    })
    return Response.json(items, {
      headers: { 'Cache-Control': CACHE_CONTROL },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': CACHE_CONTROL },
    })
  }
}
