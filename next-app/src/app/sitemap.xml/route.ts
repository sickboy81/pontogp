import { renderSitemapIndex } from '@/lib/seo-sitemap'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

export function GET() {
  return new Response(
    renderSitemapIndex([
      `${BASE}/sitemap-static.xml`,
      `${BASE}/sitemap-locais.xml`,
      `${BASE}/sitemap-anunciantes.xml`,
      `${BASE}/sitemap-guias.xml`,
      `${BASE}/sitemap-perfis.xml`,
    ]),
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  )
}
