'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Search, Filter, X, RefreshCw } from 'lucide-react'
import ProfileCard from '@/components/ProfileCard'
import type { Profile, FilterOptions } from '@/lib/types'
import { CATEGORIES, CITIES, STATES, NEIGHBORHOODS_BY_CITY } from '@/utils/constants'
import { useAuthStore } from '@/store/auth'
import { useFavoritesStore } from '@/store/favorites'

const LIMIT = 21
const LOCATION_SUGGESTIONS = Array.from(new Set([
  ...STATES,
  ...CITIES,
  ...Object.values(NEIGHBORHOODS_BY_CITY).flat(),
])).sort((a, b) => a.localeCompare(b, 'pt-BR'))

const StoriesSection = dynamic(() => import('@/components/StoriesSection'), {
  ssr: false,
  loading: () => null,
})
const FilterPanel = dynamic(() => import('@/components/FilterPanel'), {
  ssr: false,
  loading: () => null,
})

type TagMatchScope = 'city' | 'state' | 'brasil'

function parseTagScope(s: string | null): TagMatchScope | null {
  if (s === 'city' || s === 'state' || s === 'brasil') return s
  return null
}

function buildQuery(
  filters: FilterOptions,
  page: number,
  location: string,
  content: string,
  tagBlock: {
    tag?: string
    tagField?: string
    excludeProfile?: string
    tagScope?: TagMatchScope | null
  }
) {
  const params = new URLSearchParams()
  params.set('limit', String(LIMIT))
  params.set('offset', String((page - 1) * LIMIT))
  if (filters.category) params.set('category', filters.category)
  if (filters.gender) params.set('gender', filters.gender)
  const usesGeoFilters = filters.category !== 'online'
  if (usesGeoFilters && filters.state) params.set('state', filters.state)
  if (usesGeoFilters && filters.city) params.set('city', filters.city)
  if (filters.min_age != null) params.set('min_age', String(filters.min_age))
  if (filters.max_age != null) params.set('max_age', String(filters.max_age))
  if (filters.min_price != null) params.set('min_price', String(filters.min_price))
  if (filters.max_price != null) params.set('max_price', String(filters.max_price))
  if (filters.ethnicity) params.set('ethnicity', filters.ethnicity)
  if (filters.hair_color) params.set('hair_color', filters.hair_color)
  if (filters.body_type) params.set('body_type', filters.body_type)
  if (filters.verified) params.set('verified', 'true')
  if (filters.online) params.set('online', 'true')
  if (location.trim()) params.set('location', location.trim())
  if (content.trim()) params.set('content', content.trim())
  if (tagBlock.tag) params.set('tag', tagBlock.tag)
  if (tagBlock.tagField) params.set('tag_field', tagBlock.tagField)
  if (tagBlock.excludeProfile) params.set('exclude_profile', tagBlock.excludeProfile)
  if (tagBlock.tag && tagBlock.tagField && tagBlock.tagScope) params.set('tag_scope', tagBlock.tagScope)
  return params.toString()
}

export default function HomeClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tagFromUrl = searchParams.get('tag')?.trim() ?? ''
  const tagFieldFromUrl = searchParams.get('tag_field') ?? ''
  const excludeFromUrl = searchParams.get('exclude_profile') ?? ''
  const tagSearchKeyRef = useRef<string>('')
  const listGeoInitializedRef = useRef(false)
  const prevListGeoRef = useRef<{ state: string; city: string; category: string; gender: string }>({
    state: '',
    city: '',
    category: '',
    gender: '',
  })

  const [filters, setFilters] = useState<FilterOptions>(() => {
    const c = searchParams.get('category')
    const g = searchParams.get('gender')
    const s = searchParams.get('state')
    const city = searchParams.get('city')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    return {
      category: (c && ['acompanhante', 'massagista', 'online'].includes(c)) ? c as FilterOptions['category'] : 'acompanhante',
      gender: (g && ['mulher', 'homem', 'trans', 'casal'].includes(g)) ? g as FilterOptions['gender'] : 'mulher',
      ...(s && { state: s }),
      ...(city && { city }),
      ...(minPrice != null && minPrice !== '' && { min_price: Number(minPrice) }),
      ...(maxPrice != null && maxPrice !== '' && { max_price: Number(maxPrice) }),
    }
  })
  const [locationQuery, setLocationQuery] = useState(searchParams.get('location') ?? '')
  const [contentQuery, setContentQuery] = useState(searchParams.get('content') ?? searchParams.get('search') ?? '')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const planColorMap: Record<string, string> = { gratis: '#64748b', bronze: '#b45309', prata: '#737373', ouro: '#ca8a04' }

  const [debouncedLocation, setDebouncedLocation] = useState(locationQuery)
  const [debouncedContent, setDebouncedContent] = useState(contentQuery)
  const [tagMatchScope, setTagMatchScope] = useState<TagMatchScope | null>(() =>
    parseTagScope(searchParams.get('tag_scope'))
  )
  const [tagSearchBanner, setTagSearchBanner] = useState<string | null>(null)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const fetchFavorites = useFavoritesStore((s) => s.fetchFavorites)

  const tagScopeFromUrl = parseTagScope(searchParams.get('tag_scope'))
  const effectiveTagScope = tagScopeFromUrl ?? tagMatchScope
  useEffect(() => {
    const t = searchParams.get('tag')?.trim() ?? ''
    const tf = searchParams.get('tag_field') ?? ''
    const ex = searchParams.get('exclude_profile') ?? ''
    const key = `${t}|${tf}|${ex}`
    if (!t || !tf) {
      setTagMatchScope(null)
      tagSearchKeyRef.current = ''
      setTagSearchBanner(null)
      return
    }
    const ts = parseTagScope(searchParams.get('tag_scope'))
    if (ts) {
      setTagMatchScope(ts)
    } else if (tagSearchKeyRef.current !== key) {
      setTagMatchScope(null)
    }
    tagSearchKeyRef.current = key
  }, [searchParams])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(locationQuery), 500)
    return () => clearTimeout(t)
  }, [locationQuery])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedContent(contentQuery), 500)
    return () => clearTimeout(t)
  }, [contentQuery])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedLocation.trim()) params.set('location', debouncedLocation.trim())
    else params.delete('location')
    if (debouncedContent.trim()) params.set('content', debouncedContent.trim())
    else params.delete('content')
    params.delete('search')
    const next = params.toString()
    if (next !== searchParams.toString()) router.replace(next ? `/?${next}` : '/', { scroll: false })
  }, [debouncedLocation, debouncedContent, router, searchParams])

  useEffect(() => {
    if (isAuthenticated) fetchFavorites()
  }, [isAuthenticated, fetchFavorites])

  useEffect(() => {
    const c = searchParams.get('category')
    const g = searchParams.get('gender')
    const s = searchParams.get('state') ?? ''
    const city = searchParams.get('city') ?? ''
    const catResolved: NonNullable<FilterOptions['category']> =
      c && ['acompanhante', 'massagista', 'online'].includes(c) ? (c as NonNullable<FilterOptions['category']>) : 'acompanhante'
    const genResolved: NonNullable<FilterOptions['gender']> =
      g && ['mulher', 'homem', 'trans', 'casal'].includes(g) ? (g as NonNullable<FilterOptions['gender']>) : 'mulher'
    const geoChanged =
      listGeoInitializedRef.current &&
      (prevListGeoRef.current.state !== s ||
        prevListGeoRef.current.city !== city ||
        prevListGeoRef.current.category !== catResolved ||
        prevListGeoRef.current.gender !== genResolved)
    prevListGeoRef.current = { state: s, city, category: catResolved, gender: genResolved }
    listGeoInitializedRef.current = true
    setFilters((prev) => {
      if (
        prev.category === catResolved &&
        prev.gender === genResolved &&
        (prev.state ?? '') === s &&
        (prev.city ?? '') === city
      ) {
        return prev
      }
      return {
        ...prev,
        category: catResolved,
        gender: genResolved,
        ...(s ? { state: s } : { state: undefined }),
        ...(city ? { city } : { city: undefined }),
      }
    })
    if (geoChanged) setTagMatchScope(null)
  }, [searchParams])

  useEffect(() => {
    setPage(1)
    requestIdRef.current += 1
    const id = requestIdRef.current
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    const tagBlock = {
      tag: tagFromUrl || undefined,
      tagField: tagFieldFromUrl || undefined,
      excludeProfile: excludeFromUrl || undefined,
      tagScope: effectiveTagScope,
    }
    const qs = buildQuery(filters, 1, debouncedLocation, debouncedContent, tagBlock)
    fetch(`/api/profiles?${qs}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (requestIdRef.current !== id) return
        if (!res.ok) {
          setProfiles([])
          setHasMore(false)
          setTagSearchBanner(null)
          setLoadError('Não foi possível carregar os anúncios agora.')
          return
        }
        if (Array.isArray(data)) {
          setProfiles(data)
          setHasMore(data.length === LIMIT)
          setTagMatchScope(null)
          setTagSearchBanner(null)
        } else {
          const list = (data as { profiles?: Profile[]; tag_match_scope?: TagMatchScope }).profiles ?? []
          setProfiles(list)
          setHasMore(list.length === LIMIT)
          const scope = (data as { tag_match_scope?: TagMatchScope }).tag_match_scope
          if (scope && tagFromUrl && tagFieldFromUrl) {
            setTagMatchScope(scope)
            const label =
              scope === 'city'
                ? 'na mesma cidade'
                : scope === 'state'
                  ? 'no mesmo estado (ampliado)'
                  : 'em todo o Brasil (ampliado)'
            setTagSearchBanner(`Opção “${tagFromUrl}”: anunciantes ${label}.`)
          } else {
            setTagSearchBanner(null)
          }
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (requestIdRef.current === id) {
          setProfiles([])
          setHasMore(false)
          setLoadError('Não foi possível carregar os anúncios agora.')
        }
      })
      .finally(() => {
        if (requestIdRef.current === id) setLoading(false)
      })
    return () => controller.abort()
  }, [filters, debouncedLocation, debouncedContent, tagFromUrl, tagFieldFromUrl, excludeFromUrl, effectiveTagScope, reloadKey])

  const loadMore = useCallback(() => {
    const nextPage = page + 1
    const moreTagBlock = {
      tag: tagFromUrl || undefined,
      tagField: tagFieldFromUrl || undefined,
      excludeProfile: excludeFromUrl || undefined,
      tagScope: effectiveTagScope,
    }
    const qs = buildQuery(filters, nextPage, debouncedLocation, debouncedContent, moreTagBlock)
    setLoading(true)
    fetch(`/api/profiles?${qs}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setHasMore(false)
          return
        }
        const chunk = Array.isArray(data) ? data : ((data as { profiles?: Profile[] }).profiles ?? [])
        setProfiles((prev) => [...prev, ...chunk])
        setHasMore(chunk.length === LIMIT)
        setPage(nextPage)
      })
      .finally(() => setLoading(false))
  }, [filters, debouncedLocation, debouncedContent, page, tagFromUrl, tagFieldFromUrl, excludeFromUrl, effectiveTagScope])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore || loading) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '200px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loading, loadMore])

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters)
    setTagMatchScope(null)
    setPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({ category: 'acompanhante', gender: 'mulher' })
    setLocationQuery('')
    setContentQuery('')
    setPage(1)
    setTagMatchScope(null)
    setTagSearchBanner(null)
    router.push('/')
  }, [router])

  const hasActiveFilters =
    Object.keys(filters)
      .filter((k) => {
        if (['category', 'gender'].includes(k)) return false
        if (filters.category === 'online' && (k === 'state' || k === 'city')) return false
        return filters[k as keyof FilterOptions] != null
      }).length > 0 ||
    locationQuery.length > 0 ||
    contentQuery.length > 0 ||
    (tagFromUrl.length > 0 && tagFieldFromUrl.length > 0)

  const categoryLabel = CATEGORIES.find((c) => c.value === filters.category)?.label ?? 'Acompanhantes'
  const searchTerms = contentQuery.split(/[\s,]+/).map((term) => term.trim()).filter((term) => term.length >= 2).slice(0, 8)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <h1 className="sr-only">
        CerejaVIP - acompanhantes, massagistas e atendimento online no Brasil
      </h1>
      <div className="mb-6 grid gap-2 md:grid-cols-[1fr_1fr_auto_auto] md:gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 md:h-5 md:w-5" />
          <input
            type="text"
            placeholder="Cidade, bairro ou estado"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            aria-label="Buscar por localização"
            name="location"
            autoComplete="off"
            list="cerejavip-location-suggestions"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-10 text-white placeholder-slate-500 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 md:rounded-2xl md:py-4 md:pl-12"
          />
          {locationQuery && <button type="button" onClick={() => setLocationQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" aria-label="Limpar localização"><X className="h-4 w-4" /></button>}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 md:h-5 md:w-5" />
          <input
            type="text"
            placeholder="Serviços ou características"
            value={contentQuery}
            onChange={(e) => setContentQuery(e.target.value)}
            aria-label="Buscar serviços, características ou descrição"
            name="content"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-10 text-white placeholder-slate-500 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 md:rounded-2xl md:py-4 md:pl-12"
          />
          {contentQuery && <button type="button" onClick={() => setContentQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" aria-label="Limpar conteúdo"><X className="h-4 w-4" /></button>}
        </div>
        <datalist id="cerejavip-location-suggestions">
          {LOCATION_SUGGESTIONS.map((item) => <option key={item} value={item} />)}
        </datalist>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-bold text-sm transition md:rounded-2xl md:px-6 md:py-4 ${
            hasActiveFilters
              ? 'border-primary-500 bg-primary-500 text-white shadow-lg'
              : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Filter className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Filtros</span>
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-slate-800 p-3 text-slate-500 transition hover:border-red-400/50 hover:text-red-400 md:rounded-2xl md:p-4"
            title="Limpar filtros"
          >
            <X className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        )}
      </div>

      {filtersOpen ? (
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}

      <StoriesSection />

      {tagSearchBanner && (
        <div className="mb-4 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3 text-sm text-primary-100">
          {tagSearchBanner}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">{categoryLabel}</h2>
        {profiles.length > 0 && (
          <p className="mt-1 text-xs text-slate-500">
            {profiles.length} resultado{profiles.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {loading && profiles.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-slate-800">
              <div className="aspect-[3/4] bg-slate-700" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-slate-700" />
                <div className="h-3 w-1/2 rounded bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <RefreshCw className="h-8 w-8 text-amber-300" />
          </div>
          <p className="text-lg font-medium text-white">Os anúncios não carregaram</p>
          <p className="mt-2 text-sm text-slate-300">{loadError} Verifique sua conexão e tente novamente.</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-500"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 py-16 px-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-700/50">
            <Search className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-lg font-medium text-slate-300">Nenhum anúncio encontrado</p>
          <p className="mt-2 text-sm text-slate-500">Tente remover filtros, ampliar a localização ou usar outros termos de serviço e características.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-400 transition hover:border-primary-500/50 hover:text-primary-400"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {profiles.map((profile, index) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                index={index}
                planColor={planColorMap[profile.plan_slug ?? profile.plan] ?? '#dc2626'}
                priority={index === 0}
                searchTerms={searchTerms}
              />
            ))}
          </div>
          {hasMore && (
            <div ref={sentinelRef} className="mt-8 flex justify-center py-4">
              {loading && (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              )}
            </div>
          )}
        </>
      )}

    </div>
  )
}

