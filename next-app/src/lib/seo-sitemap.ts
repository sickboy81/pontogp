import { getProfileSitemapRecords } from '@/lib/api/profiles'
import { getPublicProfileUrl } from '@/lib/profile-url'
import { SEO_CITIES } from '@/lib/seo-cities'
import { SEO_GUIDES } from '@/lib/seo-guides'
import { SEO_INTENTS } from '@/lib/seo-intents'
import { getSeoNeighborhoods } from '@/lib/seo-neighborhoods'
import { SEO_STATES } from '@/lib/seo-states'

export type SitemapEntry = {
  url: string
  lastmod?: string
  priority?: number
  changefreq?: 'daily' | 'weekly' | 'monthly'
}

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

export const SITEMAP_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
}

export function getStaticSitemapEntries(): SitemapEntry[] {
  return [
    { url: BASE, changefreq: 'daily', priority: 1 },
    { url: `${BASE}/anunciantes`, changefreq: 'weekly', priority: 0.8 },
    { url: `${BASE}/planos`, changefreq: 'weekly', priority: 0.8 },
    { url: `${BASE}/sobre`, changefreq: 'monthly', priority: 0.5 },
    { url: `${BASE}/termos`, changefreq: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacidade`, changefreq: 'monthly', priority: 0.5 },
    { url: `${BASE}/seguranca`, changefreq: 'monthly', priority: 0.55 },
    { url: `${BASE}/contato`, changefreq: 'monthly', priority: 0.5 },
    { url: `${BASE}/guia`, changefreq: 'monthly', priority: 0.62 },
    { url: `${BASE}/acompanhantes-perto-de-mim`, changefreq: 'weekly', priority: 0.74 },
    { url: `${BASE}/massagistas-perto-de-mim`, changefreq: 'weekly', priority: 0.7 },
    { url: `${BASE}/acompanhantes-trans-perto-de-mim`, changefreq: 'weekly', priority: 0.7 },
  ]
}

export function getLocationSitemapEntries(): SitemapEntry[] {
  const stateEntries = SEO_STATES.map((item) => ({
    url: `${BASE}/estado/${item.slug}`,
    changefreq: 'weekly' as const,
    priority: 0.72,
  }))
  const stateIntentEntries = SEO_STATES.flatMap((state) =>
    SEO_INTENTS.map((intent) => ({
      url: `${BASE}/estado/${state.slug}/${intent.slug}`,
      changefreq: 'weekly' as const,
      priority: intent.slug === 'acompanhantes' ? 0.7 : 0.66,
    }))
  )
  const cityEntries = SEO_CITIES.map((item) => ({
    url: `${BASE}/cidade/${item.slug}`,
    changefreq: 'weekly' as const,
    priority: 0.75,
  }))
  const cityIntentEntries = SEO_CITIES.flatMap((city) =>
    SEO_INTENTS.map((intent) => ({
      url: `${BASE}/cidade/${city.slug}/${intent.slug}`,
      changefreq: 'weekly' as const,
      priority: intent.slug === 'acompanhantes' ? 0.72 : 0.68,
    }))
  )
  const neighborhoodEntries = getSeoNeighborhoods().map((item) => ({
    url: `${BASE}/cidade/${item.slug}/bairro/${item.neighborhoodSlug}`,
    changefreq: 'weekly' as const,
    priority: 0.62,
  }))
  return [...stateEntries, ...stateIntentEntries, ...cityEntries, ...cityIntentEntries, ...neighborhoodEntries]
}

export function getAdvertiserSitemapEntries(): SitemapEntry[] {
  return SEO_CITIES.map((item) => ({
    url: `${BASE}/anunciar-em/${item.slug}`,
    changefreq: 'weekly' as const,
    priority: 0.65,
  }))
}

export function getGuideSitemapEntries(): SitemapEntry[] {
  return SEO_GUIDES.map((item) => ({
    url: `${BASE}/guia/${item.slug}`,
    changefreq: 'monthly' as const,
    priority: item.audience === 'anunciantes' ? 0.64 : 0.6,
  }))
}

export async function getProfileSitemapEntries(): Promise<SitemapEntry[]> {
  const profiles = await getProfileSitemapRecords()
  return profiles.map((profile) => {
    const updated = profile.updated_at ? new Date(profile.updated_at) : null
    return {
      url: getPublicProfileUrl(profile, BASE),
      ...(updated && !Number.isNaN(updated.getTime()) ? { lastmod: updated.toISOString() } : {}),
      changefreq: 'weekly' as const,
      priority: 0.7,
    }
  })
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function renderUrlSet(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ''
      const changefreq = entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''
      const priority = entry.priority != null ? `<priority>${entry.priority.toFixed(2)}</priority>` : ''
      return `<url><loc>${escapeXml(entry.url)}</loc>${lastmod}${changefreq}${priority}</url>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
}

export function renderSitemapIndex(urls: string[]): string {
  const items = urls
    .map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`)
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`
}
