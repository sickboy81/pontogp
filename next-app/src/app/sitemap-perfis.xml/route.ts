import { getProfileSitemapEntries, renderUrlSet } from '@/lib/seo-sitemap'

export async function GET() {
  return new Response(renderUrlSet(await getProfileSitemapEntries()), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
