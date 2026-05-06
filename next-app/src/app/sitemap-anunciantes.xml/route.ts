import { getAdvertiserSitemapEntries, renderUrlSet } from '@/lib/seo-sitemap'

export function GET() {
  return new Response(renderUrlSet(getAdvertiserSitemapEntries()), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
