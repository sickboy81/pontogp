import { getGuideSitemapEntries, renderUrlSet } from '@/lib/seo-sitemap'

export function GET() {
  return new Response(renderUrlSet(getGuideSitemapEntries()), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
