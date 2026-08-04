import { getStaticSitemapEntries, renderUrlSet, SITEMAP_HEADERS } from '@/lib/seo-sitemap'

export function GET() {
  return new Response(renderUrlSet(getStaticSitemapEntries()), {
    headers: SITEMAP_HEADERS,
  })
}
