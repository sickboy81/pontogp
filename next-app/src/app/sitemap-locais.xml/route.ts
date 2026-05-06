import { getLocationSitemapEntries, renderUrlSet } from '@/lib/seo-sitemap'

export function GET() {
  return new Response(renderUrlSet(getLocationSitemapEntries()), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
