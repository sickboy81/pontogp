import { getStaticSitemapEntries, renderUrlSet } from '@/lib/seo-sitemap'

export function GET() {
  return new Response(renderUrlSet(getStaticSitemapEntries()), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
