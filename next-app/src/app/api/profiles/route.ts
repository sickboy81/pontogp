import { NextRequest } from 'next/server'
import {
  getProfiles,
  getProfileByUserId,
  isProfileJsonTagField,
  mapProfile,
  sanitizeProfileTagValue,
  type ProfileJsonTagField,
} from '@/lib/api/profiles'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getProfileDraftValidationError } from '@/lib/profile-publication.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const PUBLIC_CACHE_CONTROL = 'public, max-age=10, s-maxage=20, stale-while-revalidate=60'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type TagMatchScope = 'city' | 'state' | 'brasil'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const limit = Math.min(Number(searchParams.get('limit')) || 21, 50)
  const offset = Number(searchParams.get('offset')) || 0
  const category = searchParams.get('category')
  const gender = searchParams.get('gender')
  const state = searchParams.get('state')
  const city = searchParams.get('city')
  const min_age = searchParams.get('min_age')
  const max_age = searchParams.get('max_age')
  const min_price = searchParams.get('min_price')
  const max_price = searchParams.get('max_price')
  const online = searchParams.get('online')
  const verified = searchParams.get('verified')
  const location = searchParams.get('location')
  const content = searchParams.get('content') || searchParams.get('search')
  const sort = searchParams.get('sort') || 'default'
  const tagRaw = searchParams.get('tag')
  const tag_field = searchParams.get('tag_field')
  const tag_scope = searchParams.get('tag_scope') as TagMatchScope | null
  const exclude_profile = searchParams.get('exclude_profile')

  const isOnlineCategory = category === 'online'

  const filters: Record<string, string | number | boolean> = {}
  if (category) filters.category = category
  if (gender) filters.gender = gender
  if (!isOnlineCategory && state) filters.state = state
  if (!isOnlineCategory && city) filters.city = city
  if (min_age) filters.min_age = Number(min_age)
  if (max_age) filters.max_age = Number(max_age)
  if (min_price != null && min_price !== '') filters.min_price = Number(min_price)
  if (max_price != null && max_price !== '') filters.max_price = Number(max_price)
  if (online === 'true') filters.online = true
  if (verified === 'true') filters.verified = true
  if (location?.trim()) filters.location = location.trim()
  if (content?.trim()) filters.content = content.trim()

  const tagVal = tagRaw != null ? sanitizeProfileTagValue(tagRaw) : ''
  const tagFieldOk = tag_field && isProfileJsonTagField(tag_field) ? (tag_field as ProfileJsonTagField) : null

  try {
  if (tagVal && tagFieldOk) {
    const jsonTag = { field: tagFieldOk, value: tagVal }
    const excludeId = exclude_profile?.trim() || undefined

    const fetchScoped = (scope: TagMatchScope) => {
      const f: Record<string, string | number | boolean> = { ...filters }
      if (isOnlineCategory) {
        delete f.city
        delete f.state
      } else if (scope === 'state') delete f.city
      if (scope === 'brasil') {
        delete f.city
        delete f.state
      }
      return getProfiles({
        filters: f,
        limit,
        offset,
        sort,
        jsonTag,
        excludeProfileId: excludeId,
      })
    }

    const validScope =
      tag_scope === 'city' || tag_scope === 'state' || tag_scope === 'brasil' ? tag_scope : null

    if (validScope) {
      const effectiveScope = isOnlineCategory ? 'brasil' : validScope
      const profiles = await fetchScoped(effectiveScope)
      return Response.json(
        { profiles, tag_match_scope: effectiveScope },
        { headers: { 'Cache-Control': PUBLIC_CACHE_CONTROL } }
      )
    }

    if (offset > 0 && !validScope) {
      return Response.json(
        { error: 'Use tag_scope=city|state|brasil ao paginar resultados por etiqueta.', profiles: [], tag_match_scope: null },
        { status: 400 }
      )
    }

    if (!isOnlineCategory && city && state) {
      const cityList = await fetchScoped('city')
      if (cityList.length > 0) {
        return Response.json(
          { profiles: cityList, tag_match_scope: 'city' as const },
          { headers: { 'Cache-Control': PUBLIC_CACHE_CONTROL } }
        )
      }
    }
    if (!isOnlineCategory && state) {
      const stateList = await fetchScoped('state')
      if (stateList.length > 0) {
        return Response.json(
          { profiles: stateList, tag_match_scope: 'state' as const },
          { headers: { 'Cache-Control': PUBLIC_CACHE_CONTROL } }
        )
      }
    }
    const brList = await fetchScoped('brasil')
    return Response.json(
      { profiles: brList, tag_match_scope: 'brasil' as const },
      { headers: { 'Cache-Control': PUBLIC_CACHE_CONTROL } }
    )
  }

  const profiles = await getProfiles({ filters, limit, offset, sort })
  return Response.json(profiles, {
    headers: { 'Cache-Control': PUBLIC_CACHE_CONTROL },
  })
  } catch (error) {
    console.error('[api/profiles] PocketBase indisponível', error)
    return Response.json(
      { error: 'Perfis temporariamente indisponíveis. Tente novamente em alguns segundos.', profiles: [] },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' } }
    )
  }
}

/** POST: cria perfil para o usuário logado. */
export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  try {
    const existing = await getProfileByUserId(userId, token)
    if (existing) return Response.json(existing)

    const body = (await request.json()) as Record<string, unknown>
    const validationError = getProfileDraftValidationError(body)
    if (validationError) return Response.json({ error: validationError }, { status: 400 })

    const data: Record<string, unknown> = {
      user: userId,
      name: String(body.name ?? '').trim(),
      age: Number(body.age) || 18,
      city: String(body.city ?? '').trim(),
      state: String(body.state ?? '').trim(),
      bio: (body.bio as string) ?? '',
      category: body.category ?? 'acompanhante',
      gender: body.gender ?? 'mulher',
      ethnicity: (body.ethnicity as string) ?? '',
      services: Array.isArray(body.services) ? body.services : [],
      payment_methods: Array.isArray(body.payment_methods) ? body.payment_methods : [],
      neighborhoods: Array.isArray(body.neighborhoods) ? body.neighborhoods : [],
      service_locations: Array.isArray(body.service_locations) ? body.service_locations : [],
      service_to: Array.isArray(body.service_to) ? body.service_to : [],
      special_services: Array.isArray(body.special_services) ? body.special_services : [],
      location_approximate: body.location_approximate !== false,
      status: 'inactive',
      plan: body.plan ?? 'gratis',
      verified: false,
      show_whatsapp: body.show_whatsapp === true,
      show_telegram: body.show_telegram === true,
      show_phone: body.show_phone === true,
    }
    if (body.bio_title != null) data.bio_title = body.bio_title
    if (body.whatsapp != null) data.whatsapp = body.whatsapp
    if (body.telegram != null) data.telegram = body.telegram
    if (body.phone != null) data.phone = body.phone
    if (body.instagram != null) data.instagram = body.instagram
    if (body.twitter != null) data.twitter = body.twitter
    if (body.privacy != null) data.privacy = body.privacy
    if (body.slug != null) data.slug = body.slug
    if (body.short_description != null) data.short_description = body.short_description
    if (body.hair_color != null) data.hair_color = body.hair_color
    if (body.body_type != null) data.body_type = body.body_type
    if (body.height != null) data.height = Number(body.height)
    if (body.weight != null) data.weight = body.weight
    if (body.eye_color != null) data.eye_color = body.eye_color
    if (body.foot_size != null) data.foot_size = body.foot_size
    if (body.languages != null) data.languages = Array.isArray(body.languages) ? body.languages : []
    if (body.accepts_travel != null) data.accepts_travel = body.accepts_travel === true
    if (body.breast_type != null) data.breast_type = body.breast_type
    if (body.pubis_type != null) data.pubis_type = body.pubis_type
    if (body.onlyfans != null) data.onlyfans = body.onlyfans
    if (body.piercings != null) data.piercings = body.piercings
    if (body.tattoos != null) data.tattoos = body.tattoos
    if (body.smoker != null) data.smoker = body.smoker
    if (body.location_lat != null) data.location_lat = Number(body.location_lat)
    if (body.location_lng != null) data.location_lng = Number(body.location_lng)
    if (body.schedule != null) data.schedule = body.schedule
    if (body.price_30min != null) data.price_30min = Number(body.price_30min)
    if (body.price_1h != null) data.price_1h = Number(body.price_1h)
    if (body.price_2h != null) data.price_2h = Number(body.price_2h)
    if (body.price_overnight != null) data.price_overnight = Number(body.price_overnight)
    if (body.prices != null) data.prices = body.prices
    if (body.massage_types != null) data.massage_types = Array.isArray(body.massage_types) ? body.massage_types : []
    if (body.online_services != null) data.online_services = Array.isArray(body.online_services) ? body.online_services : []
    if (body.other_services != null) data.other_services = Array.isArray(body.other_services) ? body.other_services : []
    if (body.for_sale != null) data.for_sale = Array.isArray(body.for_sale) ? body.for_sale : []
    if (body.virtual_fantasies != null) data.virtual_fantasies = Array.isArray(body.virtual_fantasies) ? body.virtual_fantasies : []
    if (body.certified != null) data.certified = body.certified === true
    if (body.offers_happy_ending != null) data.offers_happy_ending = body.offers_happy_ending

    const res = await fetch(`${PB_URL}/api/collections/profiles/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const fieldErrors = typeof err === 'object' && err !== null && typeof (err as { data?: unknown }).data === 'object'
        ? (err as { data?: unknown }).data
        : undefined
      return Response.json(
        {
          error: (err as { message?: string }).message || 'Erro ao criar perfil',
          ...(fieldErrors ? { fields: fieldErrors } : {}),
        },
        { status: res.status }
      )
    }
    const record = (await res.json()) as Record<string, unknown>
    return Response.json(mapProfile(record) || record)
  } catch (e) {
    return Response.json({ error: 'Erro ao criar perfil' }, { status: 500 })
  }
}

