import type { MetadataRoute } from 'next'
import { getProfileSlugs } from '@/lib/api/profiles'
import { SEO_CITIES } from '@/lib/seo-cities'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/anunciantes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/planos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/termos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacidade`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contato`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const slugs = await getProfileSlugs()
  const profileEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const cityEntries: MetadataRoute.Sitemap = SEO_CITIES.map((item) => ({
    url: `${BASE}/cidade/${item.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))

  return [...staticRoutes, ...cityEntries, ...profileEntries]
}
