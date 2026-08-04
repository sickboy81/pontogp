import { getAdvertiserSitemapEntries, renderUrlSet, SITEMAP_HEADERS } from '@/lib/seo-sitemap'

export function GET() {
  return new Response(renderUrlSet(getAdvertiserSitemapEntries()), {
    headers: SITEMAP_HEADERS,
  })
}
