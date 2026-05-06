import { NEIGHBORHOODS_BY_CITY } from '@/utils/constants'
import { SEO_CITIES, type SeoCity } from '@/lib/seo-cities'

export type SeoNeighborhood = SeoCity & {
  neighborhood: string
  neighborhoodSlug: string
}

const CITY_BY_NAME_STATE = new Map(
  SEO_CITIES.map((city) => [`${city.state}|${city.city.trim().toLowerCase()}`, city])
)

export function slugifyPtBr(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getSeoNeighborhoods(): SeoNeighborhood[] {
  const items: SeoNeighborhood[] = []
  for (const [cityName, neighborhoods] of Object.entries(NEIGHBORHOODS_BY_CITY)) {
    const city = SEO_CITIES.find((item) => item.city === cityName)
    if (!city) continue
    for (const neighborhood of neighborhoods) {
      items.push({
        ...city,
        neighborhood,
        neighborhoodSlug: slugifyPtBr(neighborhood),
      })
    }
  }
  return items
}

export function findSeoNeighborhoodBySlugs(
  citySlug: string,
  neighborhoodSlug: string
): SeoNeighborhood | undefined {
  return getSeoNeighborhoods().find(
    (item) => item.slug === citySlug && item.neighborhoodSlug === neighborhoodSlug
  )
}

export function getNeighborhoodsForSeoCity(city: SeoCity, limit = 12): SeoNeighborhood[] {
  const cityMatch = CITY_BY_NAME_STATE.get(`${city.state}|${city.city.trim().toLowerCase()}`)
  if (!cityMatch) return []
  return getSeoNeighborhoods().filter((item) => item.slug === city.slug).slice(0, limit)
}
