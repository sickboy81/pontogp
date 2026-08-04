import { getLocationSitemapEntries, renderUrlSet, SITEMAP_HEADERS } from '@/lib/seo-sitemap'

export function GET() {
  return new Response(renderUrlSet(getLocationSitemapEntries()), {
    headers: SITEMAP_HEADERS,
  })
}
