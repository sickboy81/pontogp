'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Search, Filter, X } from 'lucide-react'
import ProfileCard from '@/components/ProfileCard'
import StoriesSection from '@/components/StoriesSection'
import FilterPanel from '@/components/FilterPanel'
import type { Profile, FilterOptions } from '@/lib/types'
import { CATEGORIES } from '@/utils/constants'
import { useAuthStore } from '@/store/auth'
import { useFavoritesStore } from '@/store/favorites'

const LIMIT = 21

const HomeSeoSection = dynamic(() => import('@/components/HomeSeoSection'), {
  ssr: false,
  loading: () => <div className="mt-16 h-24 rounded-2xl border border-slate-800 bg-slate-900/30" />,
})

type TagMatchScope = 'city' | 'state' | 'brasil'

function parseTagScope(s: string | null): TagMatchScope | null {
  if (s === 'city' || s === 'state' || s === 'brasil') return s
  return null
}

function buildQuery(
  filters: FilterOptions,
  page: number,
  search: string,
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
  if (filters.state) params.set('state', filters.state)
  if (filters.city) params.set('city', filters.city)
  if (filters.min_age != null) params.set('min_age', String(filters.min_age))
  if (filters.max_age != null) params.set('max_age', String(filters.max_age))
  if (filters.min_price != null) params.set('min_price', String(filters.min_price))
  if (filters.max_price != null) params.set('max_price', String(filters.max_price))
  if (filters.ethnicity) params.set('ethnicity', filters.ethnicity)
  if (filters.hair_color) params.set('hair_color', filters.hair_color)
  if (filters.body_type) params.set('body_type', filters.body_type)
  if (filters.verified) params.set('verified', 'true')
  if (filters.online) params.set('online', 'true')
  if (search.trim()) params.set('search', search.trim())
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
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const planColorMap: Record<string, string> = { gratis: '#64748b', bronze: '#b45309', prata: '#737373', ouro: '#ca8a04' }

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const [showSeoSection, setShowSeoSection] = useState(false)
  const [tagMatchScope, setTagMatchScope] = useState<TagMatchScope | null>(() =>
    parseTagScope(searchParams.get('tag_scope'))
  )
  const [tagSearchBanner, setTagSearchBanner] = useState<string | null>(null)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const fetchFavorites = useFavoritesStore((s) => s.fetchFavorites)

  const tagScopeFromUrl = parseTagScope(searchParams.get('tag_scope'))
  const effectiveTagScope = tagScopeFromUrl ?? tagMatchScope
  const tagBlock = {
    tag: tagFromUrl || undefined,
    tagField: tagFieldFromUrl || undefined,
    excludeProfile: excludeFromUrl || undefined,
    tagScope: effectiveTagScope,
  }
  const tagScopeUrlKey = searchParams.get('tag_scope') ?? ''

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
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    const run = () => {
      if (!cancelled) setShowSeoSection(true)
    }
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 2000 })
      return () => {
        cancelled = true
        window.cancelIdleCallback(id)
      }
    }
    const t = globalThis.setTimeout(run, 900)
    return () => {
      cancelled = true
      globalThis.clearTimeout(t)
    }
  }, [])

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
    setFilters((prev) => ({
      ...prev,
      category: catResolved,
      gender: genResolved,
      ...(s ? { state: s } : { state: undefined }),
      ...(city ? { city } : { city: undefined }),
    }))
    if (geoChanged) setTagMatchScope(null)
  }, [searchParams])

  useEffect(() => {
    setPage(1)
    requestIdRef.current += 1
    const id = requestIdRef.current
    setLoading(true)
    const qs = buildQuery(filters, 1, debouncedSearch, tagBlock)
    fetch(`/api/profiles?${qs}`)
      .then(async (res) => {
        const data = await res.json()
        if (requestIdRef.current !== id) return
        if (!res.ok) {
          setProfiles([])
          setHasMore(false)
          setTagSearchBanner(null)
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
      .catch(() => {
        if (requestIdRef.current === id) setProfiles([])
      })
      .finally(() => {
        if (requestIdRef.current === id) setLoading(false)
      })
  }, [filters, debouncedSearch, tagFromUrl, tagFieldFromUrl, excludeFromUrl, tagScopeUrlKey])

  const loadMore = useCallback(() => {
    const nextPage = page + 1
    const scopeForPage = parseTagScope(searchParams.get('tag_scope')) ?? tagMatchScope
    const moreTagBlock = {
      tag: tagFromUrl || undefined,
      tagField: tagFieldFromUrl || undefined,
      excludeProfile: excludeFromUrl || undefined,
      tagScope: scopeForPage,
    }
    const qs = buildQuery(filters, nextPage, debouncedSearch, moreTagBlock)
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
  }, [filters, debouncedSearch, page, tagFromUrl, tagFieldFromUrl, excludeFromUrl, tagMatchScope, tagScopeUrlKey])

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
    setSearchQuery('')
    setPage(1)
    setTagMatchScope(null)
    setTagSearchBanner(null)
    router.push('/')
  }, [router])

  const hasActiveFilters =
    Object.keys(filters).filter((k) => !['category', 'gender'].includes(k) && filters[k as keyof FilterOptions] != null).length > 0 ||
    searchQuery.length > 0 ||
    (tagFromUrl.length > 0 && tagFieldFromUrl.length > 0)

  const categoryLabel = CATEGORIES.find((c) => c.value === filters.category)?.label ?? 'Acompanhantes'

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <h1 className="sr-only">
        CerejaVIP - acompanhantes, massagistas e atendimento online no Brasil
      </h1>
      <div className="mb-6 flex gap-2 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 md:h-5 md:w-5" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar anúncios"
            name="search"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-4 text-white placeholder-slate-500 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 md:rounded-2xl md:py-4 md:pl-12"
          />
        </div>
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

      <FilterPanel
        filters={filters}
        onChange={handleFilterChange}
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      />

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
      ) : profiles.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 py-16 px-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-700/50">
            <Search className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-lg font-medium text-slate-300">Nenhum anúncio encontrado</p>
          <p className="mt-2 text-sm text-slate-500">Ajuste os filtros ou faça uma nova busca.</p>
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
                priority={index < 4}
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

      {showSeoSection ? <HomeSeoSection /> : null}
    </div>
  )
}
