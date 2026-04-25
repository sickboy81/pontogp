import type { Profile, Schedule } from '@/lib/types'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

function toPBDate(d: Date = new Date()) {
  return d.toISOString().replace('T', ' ')
}

/** Mapeia registro PocketBase (com expand) para Profile. Exportado para uso em rotas (ex.: favoritos). */
export function mapProfile(record: Record<string, unknown> & { expand?: Record<string, unknown> }): Profile | null {
  if (!record?.id) return null
  const expand = (record.expand || {}) as Record<string, { file?: string; collectionId?: string; id?: string }[] | { file?: string; collectionId?: string; id?: string }>
  let photos: string[] = []
  const photoList = expand.photos
  if (Array.isArray(photoList)) {
    photos = photoList
      .map((f) => {
        if (f?.file) return `${PB_URL}/api/files/${f.collectionId}/${f.id}/${f.file}`
        return ''
      })
      .filter(Boolean)
  }
  const firstPhoto = Array.isArray(photoList) ? photoList[0] : photoList
  const thumbnail =
    firstPhoto && firstPhoto.file
      ? `${PB_URL}/api/files/${firstPhoto.collectionId}/${firstPhoto.id}/${firstPhoto.file}?thumb=400x600`
      : photos[0] || ''
  const videoList = expand.videos
  const videos = Array.isArray(videoList)
    ? videoList
        .map((f: { file?: string; collectionId?: string; id?: string }) =>
          f?.file ? `${PB_URL}/api/files/${f.collectionId}/${f.id}/${f.file}` : ''
        )
        .filter(Boolean)
    : []
  const audioExpand = expand.audio as { file?: string; collectionId?: string; id?: string } | undefined
  const audio =
    audioExpand?.file ?
      `${PB_URL}/api/files/${audioExpand.collectionId}/${audioExpand.id}/${audioExpand.file}`
    : undefined
  const created = (record.created ?? record.date_created ?? record.created_at) as string
  const updated = (record.updated ?? record.date_updated ?? record.updated_at) as string
  const onlineUntil = record.online_until as string | undefined
  const isOnline =
    record.is_online === true && (!onlineUntil || new Date(onlineUntil) > new Date())

  const planEx = expand.plan
  let plan_slug: string | undefined
  if (planEx && typeof planEx === 'object' && !Array.isArray(planEx) && 'slug' in planEx) {
    plan_slug = String((planEx as { slug?: string }).slug || '')
  } else {
    const rawPlan = record.plan as string | undefined
    if (rawPlan && !/^[a-z0-9]{15}$/i.test(rawPlan)) {
      plan_slug = rawPlan
    }
  }

  return {
    ...record,
    id: record.id as string,
    user_id: (record.user ?? record.user_id) as string,
    photos,
    thumbnail,
    videos,
    audio,
    services: (record.services as string[]) || [],
    payment_methods: (record.payment_methods as string[]) || [],
    neighborhoods: (record.neighborhoods as string[]) || [],
    created_at: created,
    updated_at: updated,
    favorites_count: (record.favorites_count as number) || 0,
    views: (record.views as number) || 0,
    clicks: (record.clicks as number) || 0,
    is_online: isOnline,
    contact_expires_at: record.contact_expires_at as string | undefined,
    search_expires_at: record.search_expires_at as string | undefined,
    last_bump_at: record.last_bump_at as string | undefined,
    auto_bump: record.auto_bump as boolean | undefined,
    bumps_used_today: (record.bumps_used_today as number) ?? 0,
    bumps_used_date: record.bumps_used_date as string | undefined,
    location_lat: record.location_lat != null ? Number(record.location_lat) : undefined,
    location_lng: record.location_lng != null ? Number(record.location_lng) : undefined,
    schedule: (record.schedule as Schedule[]) || undefined,
    hair_color: record.hair_color as string | undefined,
    body_type: record.body_type as string | undefined,
    height: record.height != null ? Number(record.height) : undefined,
    weight: record.weight as string | undefined,
    height_exact: record.height_exact as string | undefined,
    breast_type: record.breast_type as string | undefined,
    pubis_type: record.pubis_type as string | undefined,
    service_locations: (record.service_locations as string[]) || [],
    service_to: (record.service_to as string[]) || [],
    special_services: (record.special_services as string[]) || [],
    massage_types: (record.massage_types as string[]) || undefined,
    online_services: (record.online_services as string[]) || undefined,
    other_services: (record.other_services as string[]) || undefined,
    for_sale: (record.for_sale as string[]) || undefined,
    virtual_fantasies: (record.virtual_fantasies as string[]) || undefined,
    certified: record.certified as boolean | undefined,
    offers_happy_ending: record.offers_happy_ending as boolean | undefined,
    onlyfans: record.onlyfans as string | undefined,
    privacy: record.privacy as string | undefined,
    piercings: record.piercings as boolean | undefined,
    tattoos: record.tattoos as boolean | undefined,
    smoker: record.smoker as string | undefined,
    display_mode: record.display_mode as 'default' | 'link_bio' | undefined,
    bio_theme: record.bio_theme as string | undefined,
    bio_button_color: record.bio_button_color as string | undefined,
    bio_links: Array.isArray(record.bio_links) ? (record.bio_links as Array<{ label: string; url: string }>) : undefined,
    bio_avatar_index: record.bio_avatar_index != null ? Number(record.bio_avatar_index) : undefined,
    bio_show_full_profile: record.bio_show_full_profile !== false,
    plan_slug,
  } as Profile
}

const LIFECYCLE = `status != "archived" && (search_expires_at = "" || search_expires_at > "${toPBDate()}")`

const SORT_MAP: Record<string, string> = {
  default: '-last_bump_at,-created',
  recent: '-created',
  price_asc: 'price_1h',
  price_desc: '-price_1h',
  views: '-views',
}

/** Campos JSON (array de strings) nos quais se pode filtrar por uma opção exata do perfil. */
export const PROFILE_JSON_TAG_FIELDS = [
  'services',
  'payment_methods',
  'neighborhoods',
  'service_locations',
  'service_to',
  'special_services',
  'massage_types',
  'online_services',
  'other_services',
  'for_sale',
  'virtual_fantasies',
] as const

export type ProfileJsonTagField = (typeof PROFILE_JSON_TAG_FIELDS)[number]

export function isProfileJsonTagField(s: string): s is ProfileJsonTagField {
  return (PROFILE_JSON_TAG_FIELDS as readonly string[]).includes(s)
}

/** Remove metacaracteres de LIKE e aspas para evitar injeção no filtro PocketBase. */
export function sanitizeProfileTagValue(raw: string): string {
  return raw.replace(/["\\%_]/g, '').trim().slice(0, 160)
}

function escapeDoubleQuotes(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/** Lista perfis (servidor). Filtros: equality + min_age, max_age, min_price, max_price, online, verified, search. sort: default | recent | price_asc | price_desc | views */
export async function getProfiles(options: {
  filters?: Record<string, string | number | boolean>
  limit?: number
  offset?: number
  sort?: string
  /** Corresponde a um elemento do array JSON (substring no texto serializado). */
  jsonTag?: { field: ProfileJsonTagField; value: string }
  excludeProfileId?: string
}): Promise<Profile[]> {
  const {
    filters = {},
    limit = 21,
    offset = 0,
    sort: sortKey = 'default',
    jsonTag,
    excludeProfileId,
  } = options
  const parts: string[] = []
  Object.entries(filters).forEach(([key, val]) => {
    if (key === 'min_age' || key === 'max_age' || key === 'search' || key === 'min_price' || key === 'max_price') return
    const k = key === 'user_id' ? 'user' : key
    if (val === null || val === undefined) return
    if (typeof val === 'boolean') parts.push(`${k} = ${val}`)
    else parts.push(`${k} = "${escapeDoubleQuotes(String(val))}"`)
  })
  if (filters.min_age != null) parts.push(`age >= ${Number(filters.min_age)}`)
  if (filters.max_age != null) parts.push(`age <= ${Number(filters.max_age)}`)
  if (filters.min_price != null) parts.push(`price_1h >= ${Number(filters.min_price)}`)
  if (filters.max_price != null) parts.push(`price_1h <= ${Number(filters.max_price)}`)
  if (filters.search) {
    const q = escapeDoubleQuotes(String(filters.search))
    parts.push(`(name ~ "${q}" || bio ~ "${q}" || search_normalized ~ "${q}")`)
  }
  if (jsonTag?.value) {
    const v = escapeDoubleQuotes(jsonTag.value)
    parts.push(`${jsonTag.field} ~ "%${v}%"`)
  }
  if (excludeProfileId) {
    parts.push(`id != "${escapeDoubleQuotes(excludeProfileId)}"`)
  }
  let filterStr = parts.length ? `(${parts.join(' && ')}) && (${LIFECYCLE})` : LIFECYCLE
  const sort = SORT_MAP[sortKey] || SORT_MAP.default
  const page = Math.floor(offset / limit) + 1
  const res = await fetch(
    `${PB_URL}/api/collections/profiles/records?page=${page}&perPage=${limit}&filter=${encodeURIComponent(filterStr)}&expand=photos,videos,audio,plan&sort=${encodeURIComponent(sort)}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.items || []).map(mapProfile).filter((p: Profile | null): p is Profile => p !== null)
}

/** Busca perfil do usuário por user id (servidor). Não aplica LIFECYCLE para permitir edição mesmo expirado. */
export async function getProfileByUserId(
  userId: string,
  token: string
): Promise<Profile | null> {
  try {
    const filter = `user = "${userId}"`
    const res = await fetch(
      `${PB_URL}/api/collections/profiles/records?filter=${encodeURIComponent(filter)}&perPage=1&expand=photos,videos,audio,plan`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    const item = data.items?.[0]
    return item ? mapProfile(item) : null
  } catch {
    return null
  }
}

/** Busca perfil por ID (servidor). */
export async function getProfile(id: string): Promise<Profile | null> {
  try {
    const res = await fetch(
      `${PB_URL}/api/collections/profiles/records/${id}?expand=photos,videos,audio,plan`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return null
    const record = await res.json()
    return mapProfile(record)
  } catch {
    return null
  }
}

/** Busca perfil por slug (servidor). Slug sem @. */
export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  try {
    const filter = `slug = "${slug}"`
    const res = await fetch(
      `${PB_URL}/api/collections/profiles/records?filter=${encodeURIComponent(filter)}&perPage=1&expand=photos,videos,audio,plan`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const item = data.items?.[0]
    return item ? mapProfile(item) : null
  } catch {
    return null
  }
}

/** Lista slugs de perfis (para sitemap). */
export async function getProfileSlugs(): Promise<string[]> {
  try {
    const res = await fetch(
      `${PB_URL}/api/collections/profiles/records?perPage=500&fields=slug&filter=${encodeURIComponent(LIFECYCLE)}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.items || []).map((r: { slug?: string }) => r.slug).filter(Boolean)
  } catch {
    return []
  }
}
