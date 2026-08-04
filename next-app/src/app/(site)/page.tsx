import type { Metadata } from 'next'
import { Suspense } from 'react'
import HomeClient from '@/components/HomeClient'
import HomeSeoSection from '@/components/HomeSeoSection'
import { getHomeSearchParamsURL, resolveHomeCanonical } from '@/lib/seo-home'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

const DEFAULT_TITLE = 'CerejaVIP - Acompanhantes Verificadas em Todo Brasil'
const DEFAULT_DESCRIPTION =
  'Encontre acompanhantes verificadas em todo o Brasil, com fotos reais, filtros por cidade e contato direto. Perfis femininos, masculinos, trans e massagistas.'

const HOME_OG_IMAGE = `${SITE_URL}/opengraph-image`
const HOME_TWITTER_IMAGE = `${SITE_URL}/twitter-image`

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = getHomeSearchParamsURL(await searchParams)
  const { canonical, noindex } = resolveHomeCanonical(sp)
  const base: Metadata = {
    title: { absolute: DEFAULT_TITLE },
    description: DEFAULT_DESCRIPTION,
    alternates: { canonical },
  }
  if (noindex) {
    return {
      ...base,
      robots: { index: false, follow: true },
      openGraph: {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        url: `${SITE_URL}/`,
        type: 'website',
        images: [{ url: HOME_OG_IMAGE, width: 1200, height: 630, alt: 'CerejaVIP - Acompanhantes Brasil' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        images: [HOME_TWITTER_IMAGE],
      },
    }
  }
  return {
    ...base,
    openGraph: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      url: canonical,
      type: 'website',
      images: [{ url: HOME_OG_IMAGE, width: 1200, height: 630, alt: 'CerejaVIP - Acompanhantes Brasil' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [HOME_TWITTER_IMAGE],
    },
  }
}

export default function HomePage() {
  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: `${SITE_URL}/`,
    inLanguage: 'pt-BR',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Categorias principais',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Acompanhantes femininas', url: `${SITE_URL}/anunciantes` },
        { '@type': 'ListItem', position: 2, name: 'Acompanhantes masculinos', url: `${SITE_URL}/anunciantes` },
        { '@type': 'ListItem', position: 3, name: 'Acompanhantes trans', url: `${SITE_URL}/anunciantes` },
        { '@type': 'ListItem', position: 4, name: 'Massagistas', url: `${SITE_URL}/anunciantes` },
        { '@type': 'ListItem', position: 5, name: 'Atendimento online', url: `${SITE_URL}/anunciantes` },
      ],
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-slate-800">
                  <div className="aspect-[3/4] bg-slate-700" />
                  <div className="h-4 w-3/4 bg-slate-700 p-4" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <HomeClient />
      </Suspense>
      <div className="mx-auto max-w-7xl px-4">
        <HomeSeoSection />
      </div>
    </>
  )
}
