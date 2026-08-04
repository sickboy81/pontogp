import { getProfileSitemapEntries, renderUrlSet, SITEMAP_HEADERS } from '@/lib/seo-sitemap'

export async function GET() {
  return new Response(renderUrlSet(await getProfileSitemapEntries()), {
    headers: SITEMAP_HEADERS,
  })
}
