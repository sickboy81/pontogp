'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Menu, X, MapPin, Heart, MessageCircle, Locate, Loader2 } from 'lucide-react'
import { useAuthStore, isAdminRole } from '@/store/auth'
import NotificationBell from '@/components/NotificationBell'
import ThemeToggle from '@/components/ThemeToggle'
import { CATEGORIES, GENDERS, STATES, getCitiesByState } from '@/utils/constants'

type CategoryValue = 'acompanhante' | 'massagista' | 'online'
type GenderValue = 'mulher' | 'homem' | 'trans' | 'casal'

const iconBtnClass = 'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white'

export default function SiteHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [locationState, setLocationState] = useState(() => searchParams.get('state') || '')
  const [locationCity, setLocationCity] = useState(() => searchParams.get('city') || '')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const locationRef = useRef<HTMLDivElement>(null)

  const STATE_NAME_TO_UF: Record<string, string> = {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA',
    'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES', 'Goiás': 'GO',
    'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
    'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE', 'Piauí': 'PI',
    'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS',
    'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP',
    'Sergipe': 'SE', 'Tocantins': 'TO',
  }
  const { isAuthenticated, user, logout } = useAuthStore()
  const isAdmin = !!user && isAdminRole(user.role)

  const isHome = pathname === '/'
  const currentCategory = (isHome ? searchParams.get('category') : null) || 'acompanhante'
  const currentGender = (isHome ? searchParams.get('gender') : null) || 'mulher'
  const validCategory: CategoryValue = ['acompanhante', 'massagista', 'online'].includes(currentCategory) ? currentCategory as CategoryValue : 'acompanhante'
  const validGender: GenderValue = ['mulher', 'homem', 'trans', 'casal'].includes(currentGender) ? currentGender as GenderValue : 'mulher'

  const applyFilters = (category: CategoryValue, gender: GenderValue) => {
    const params = new URLSearchParams(isHome ? searchParams.toString() : '')
    params.set('category', category)
    params.set('gender', gender)
    const query = params.toString()
    const url = query ? `/?${query}` : '/'
    if (pathname === '/') router.replace(url, { scroll: false })
    else router.push(url)
  }

  const applyLocation = (state: string, city: string) => {
    const params = new URLSearchParams(isHome ? searchParams.toString() : '')
    params.set('category', validCategory)
    params.set('gender', validGender)
    if (state) params.set('state', state)
    else params.delete('state')
    if (city) params.set('city', city)
    else params.delete('city')
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
    setLocationOpen(false)
  }

  const locationCities = getCitiesByState(locationState)

  async function handleUseCurrentLocation() {
    setGeoError(null)
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      setGeoError('Geolocalização não disponível no seu navegador.')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`,
            { headers: { Accept: 'application/json', 'User-Agent': 'CerejaVIP-App' } }
          )
          const data = await res.json()
          const addr = data?.address || {}
          const stateName = addr.state
          const uf = stateName ? (STATE_NAME_TO_UF[stateName] || (addr['ISO3166-2-lvl4']?.replace('BR-', '') || '')) : ''
          const city = addr.city || addr.town || addr.village || addr.municipality || ''
          if (uf && STATES.includes(uf)) {
            setLocationState(uf)
            const cities = getCitiesByState(uf)
            setLocationCity(cities.includes(city) ? city : '')
          } else if (uf) {
            setLocationState(uf)
            setLocationCity(city || '')
          } else {
            setGeoError('Não foi possível identificar estado/cidade.')
          }
        } catch {
          setGeoError('Erro ao obter endereço.')
        } finally {
          setGeoLoading(false)
        }
      },
      () => {
        setGeoError('Permissão de localização negada ou indisponível.')
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setLocationOpen(false)
    }
    if (menuOpen || locationOpen) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen, locationOpen])

  const closeAll = () => {
    setMobileOpen(false)
    setMenuOpen(false)
    setLocationOpen(false)
  }

  const mainNav = (
    <>
      <Link href="/" className="text-slate-300 hover:text-white" onClick={closeAll}>Início</Link>
      <Link href="/anunciantes" className="text-slate-300 hover:text-white" onClick={closeAll}>Anunciantes</Link>
      <Link href="/planos" className="text-slate-300 hover:text-white" onClick={closeAll}>Planos</Link>
    </>
  )

  const categoryGenderNav = (
    <nav className="flex items-center gap-2">
      <label className="sr-only" htmlFor="header-category">Categoria</label>
      <select
        id="header-category"
        value={validCategory}
        onChange={(e) => applyFilters(e.target.value as CategoryValue, validGender)}
        className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor="header-gender">Gênero</label>
      <select
        id="header-gender"
        value={validGender}
        onChange={(e) => applyFilters(validCategory, e.target.value as GenderValue)}
        className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {GENDERS.map((g) => (
          <option key={g.value} value={g.value}>{g.label}</option>
        ))}
      </select>
    </nav>
  )

  return (
    <header className="site-header sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-2 md:py-3">
        {/* Linha 1: logo (maior) + ícones à direita */}
        <div className="flex min-h-14 items-center justify-between md:min-h-16">
          <Link
            href="/"
            className="flex items-center gap-2"
            title="Página inicial"
            onClick={(e) => {
              closeAll()
              if (pathname === '/' && searchParams.toString()) {
                e.preventDefault()
                router.replace('/')
              }
              if (pathname === '/' && typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
          >
            <img src="/logo-header.png" alt="CerejaVIP" className="h-11 w-auto max-h-12 object-contain md:h-14 md:max-h-16" />
          </Link>

          {/* Direita: tema + ícones (no mobile só Favoritos e Notificação; no desktop todos) */}
          <div className="flex items-center gap-1">
          <ThemeToggle />
          {/* Mobile: Favoritos e Notificação sempre visíveis */}
          <div className="flex items-center gap-0.5 md:hidden">
            <Link href={isAuthenticated ? '/favoritos' : '/login'} className={iconBtnClass} aria-label="Favoritos">
              <Heart className="h-5 w-5" />
            </Link>
            <NotificationBell />
          </div>
          {/* Desktop: todos os ícones */}
          <div className="hidden items-center gap-0.5 md:flex">
            {isAuthenticated ? (
              <>
                <div className="relative" ref={locationRef}>
                  <button
                    type="button"
                    onClick={() => { setLocationState(searchParams.get('state') || ''); setLocationCity(searchParams.get('city') || ''); setLocationOpen((o) => !o) }}
                    className={iconBtnClass}
                    aria-label="Filtrar por localização"
                    aria-expanded={locationOpen}
                  >
                    <MapPin className="h-5 w-5" />
                  </button>
                  {locationOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-700 bg-slate-800 p-3 shadow-xl">
                      <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Localização</p>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          disabled={geoLoading}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-700 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-60"
                        >
                          {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                          Localização atual
                        </button>
                        {geoError && <p className="text-xs text-red-400">{geoError}</p>}
                        <select
                          value={locationState}
                          onChange={(e) => { setLocationState(e.target.value); setLocationCity(''); setGeoError(null) }}
                          className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white"
                        >
                          <option value="">Todos os estados</option>
                          {STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <select
                          value={locationCity}
                          onChange={(e) => setLocationCity(e.target.value)}
                          disabled={!locationState}
                          className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white disabled:opacity-50"
                        >
                          <option value="">{locationState ? 'Todas as cidades' : 'Selecione o estado'}</option>
                          {locationCities.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => applyLocation(locationState, locationCity)}
                          className="w-full rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-500"
                        >
                          Ver anúncios
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <Link href="/favoritos" className={iconBtnClass} aria-label="Favoritos"> <Heart className="h-5 w-5" /> </Link>
                <Link href="/mensagens" className={iconBtnClass} aria-label="Mensagens"> <MessageCircle className="h-5 w-5" /> </Link>
                <NotificationBell />
              </>
            ) : (
              <>
                <div className="relative" ref={locationRef}>
                  <button
                    type="button"
                    onClick={() => { setLocationState(searchParams.get('state') || ''); setLocationCity(searchParams.get('city') || ''); setLocationOpen((o) => !o) }}
                    className={iconBtnClass}
                    aria-label="Filtrar por localização"
                    aria-expanded={locationOpen}
                  >
                    <MapPin className="h-5 w-5" />
                  </button>
                  {locationOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-700 bg-slate-800 p-3 shadow-xl">
                      <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Localização</p>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          disabled={geoLoading}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-700 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-60"
                        >
                          {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                          Localização atual
                        </button>
                        {geoError && <p className="text-xs text-red-400">{geoError}</p>}
                        <select
                          value={locationState}
                          onChange={(e) => { setLocationState(e.target.value); setLocationCity(''); setGeoError(null) }}
                          className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white"
                        >
                          <option value="">Todos os estados</option>
                          {STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <select
                          value={locationCity}
                          onChange={(e) => setLocationCity(e.target.value)}
                          disabled={!locationState}
                          className="w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white disabled:opacity-50"
                        >
                          <option value="">{locationState ? 'Todas as cidades' : 'Selecione o estado'}</option>
                          {locationCities.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => applyLocation(locationState, locationCity)}
                          className="w-full rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-500"
                        >
                          Ver anúncios
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <Link href="/login" className={iconBtnClass} aria-label="Favoritos (entrar)"> <Heart className="h-5 w-5" /> </Link>
                <Link href="/register" className="ml-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500">Anunciar Grátis</Link>
              </>
            )}
          </div>

          {/* Um único hambúrguer: no desktop abre dropdown (Início, Anunciantes, Planos, Dashboard/Sair); no mobile abre o drawer */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                if (isMobile) { setMobileOpen((o) => !o); setMenuOpen(false) }
                else { setMenuOpen((o) => !o); setMobileOpen(false) }
              }}
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${iconBtnClass}`}
              aria-label={mobileOpen || menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen || mobileOpen}
            >
              {mobileOpen || menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {!isMobile && menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
                <Link href="/" className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white" onClick={closeAll}>Início</Link>
                <Link href="/anunciantes" className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white" onClick={closeAll}>Anunciantes</Link>
                <Link href="/planos" className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white" onClick={closeAll}>Planos</Link>
                <div className="my-1 border-t border-slate-600" />
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white" onClick={closeAll}>Dashboard</Link>
                    {isAdmin && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-amber-400 hover:bg-slate-700 hover:text-amber-300" onClick={closeAll}>Admin</Link>
                    )}
                    <button type="button" className="w-full px-4 py-2 text-left text-sm text-slate-400 hover:bg-slate-700 hover:text-white" onClick={() => { logout(); closeAll() }}>Sair</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white" onClick={closeAll}>Entrar</Link>
                    <Link href="/register" className="block px-4 py-2 text-sm text-slate-400 hover:bg-slate-700 hover:text-white" onClick={closeAll}>Cadastrar</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Linha 2: dropdowns Categoria e Gênero abaixo do logo */}
        <div className="mt-2 pb-1 md:mt-1 md:pb-0">
          {categoryGenderNav}
        </div>
      </div>

      {isMobile && mobileOpen && (
        <nav className="border-t border-slate-700/50 bg-slate-900 px-4 py-4 md:hidden">
          <div className="mb-4 flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Filtrar</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-0.5 block text-xs text-slate-400">Categoria</label>
                <select
                  value={validCategory}
                  onChange={(e) => { applyFilters(e.target.value as CategoryValue, validGender); closeAll() }}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-slate-400">Gênero</label>
                <select
                  value={validGender}
                  onChange={(e) => { applyFilters(validCategory, e.target.value as GenderValue); closeAll() }}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {mainNav}
            {isAuthenticated ? (
              <>
                <Link href="/favoritos" className="text-slate-300 hover:text-white" onClick={closeAll}>Favoritos</Link>
                <Link href="/mensagens" className="text-slate-300 hover:text-white" onClick={closeAll}>Mensagens</Link>
                <Link href="/notificacoes" className="text-slate-300 hover:text-white" onClick={closeAll}>Notificações</Link>
                <Link href="/dashboard" className="text-slate-300 hover:text-white" onClick={closeAll}>Dashboard</Link>
                {isAdmin && <Link href="/admin" className="text-amber-400 hover:text-amber-300" onClick={closeAll}>Admin</Link>}
                <button type="button" onClick={() => { logout(); closeAll() }} className="text-left text-slate-400 hover:text-white">Sair</button>
              </>
            ) : (
              <>
                <Link href="/register" className="rounded-lg bg-primary-600 px-4 py-2 text-center font-semibold text-white hover:bg-primary-500" onClick={closeAll}>Anunciar Grátis</Link>
                <Link href="/login" className="text-slate-300 hover:text-white" onClick={closeAll}>Entrar</Link>
                <Link href="/register" className="text-slate-300 hover:text-white" onClick={closeAll}>Cadastrar</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
