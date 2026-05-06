import { SEO_CITIES, type SeoCity } from '@/lib/seo-cities'
import { findSeoStateByUf, type SeoState } from '@/lib/seo-states'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

const LANDING_PARAM_KEYS = new Set(['state', 'city', 'category', 'gender'])

function normalizeCityName(s: string): string {
  return decodeURIComponent(s).trim().toLowerCase()
}

function findSeoCityByParams(
  stateUf: string,
  cityName: string
): SeoCity | undefined {
  const c = normalizeCityName(cityName)
  if (!c) return undefined
  return SEO_CITIES.find(
    (item) => item.state === stateUf && item.city.trim().toLowerCase() === c
  )
}

function isDefaultCategoryGender(category: string, gender: string): boolean {
  return (
    (category === '' || category === 'acompanhante') &&
    (gender === '' || gender === 'mulher')
  )
}

function hasDisallowedQueryKeys(
  sp: URLSearchParams
): boolean {
  for (const key of sp.keys()) {
    if (!LANDING_PARAM_KEYS.has(key)) return true
  }
  return false
}

/**
 * Converte a home com query em canonical estável: mescla facetação infinita na raiz
 * ou aponta para a landing de cidade/estado quando a URL for equivalente às guias oficiais.
 */
export function resolveHomeCanonical(
  sp: URLSearchParams
): { canonical: string; noindex: boolean; matchedCity?: SeoCity; matchedState?: SeoState } {
  if (hasDisallowedQueryKeys(sp)) {
    return { canonical: `${SITE_URL}/`, noindex: true }
  }

  const stateUf = (sp.get('state') || '').trim().toUpperCase()
  const city = sp.get('city') || ''
  const category = (sp.get('category') || '').trim()
  const gender = (sp.get('gender') || '').trim()

  if (!isDefaultCategoryGender(category, gender)) {
    return { canonical: `${SITE_URL}/`, noindex: true }
  }

  if (stateUf && city) {
    const hit = findSeoCityByParams(stateUf, city)
    if (hit) {
      return { canonical: `${SITE_URL}/cidade/${hit.slug}`, noindex: false, matchedCity: hit }
    }
    return { canonical: `${SITE_URL}/`, noindex: true }
  }

  if (stateUf && !city) {
    const st = findSeoStateByUf(stateUf)
    if (st) {
      return { canonical: `${SITE_URL}/estado/${st.slug}`, noindex: false, matchedState: st }
    }
    return { canonical: `${SITE_URL}/`, noindex: true }
  }

  return { canonical: `${SITE_URL}/`, noindex: false }
}

/** Redireciona apenas queries equivalentes a landings oficiais, preservando filtros livres na home. */
export function resolveHomeRedirectPath(sp: URLSearchParams): string | null {
  if (hasDisallowedQueryKeys(sp)) return null

  const stateUf = (sp.get('state') || '').trim().toUpperCase()
  const city = sp.get('city') || ''
  const category = (sp.get('category') || '').trim()
  const gender = (sp.get('gender') || '').trim()

  if (!isDefaultCategoryGender(category, gender)) return null

  if (stateUf && city) {
    const hit = findSeoCityByParams(stateUf, city)
    return hit ? `/cidade/${hit.slug}` : null
  }

  if (stateUf && !city) {
    const st = findSeoStateByUf(stateUf)
    return st ? `/estado/${st.slug}` : null
  }

  return null
}

export function getHomeSearchParamsURL(sp: { [key: string]: string | string[] | undefined } | URLSearchParams) {
  if (sp instanceof URLSearchParams) return sp
  const u = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    if (v == null) continue
    if (Array.isArray(v)) v.forEach((x) => u.append(k, x))
    else u.set(k, v)
  }
  return u
}
