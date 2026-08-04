import { getGuideSitemapEntries, renderUrlSet, SITEMAP_HEADERS } from '@/lib/seo-sitemap'

export function GET() {
  return new Response(renderUrlSet(getGuideSitemapEntries()), {
    headers: SITEMAP_HEADERS,
  })
}
