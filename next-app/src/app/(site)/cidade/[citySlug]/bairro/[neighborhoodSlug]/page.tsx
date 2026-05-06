import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProfileCard from '@/components/ProfileCard'
import SeoBreadcrumbs from '@/components/SeoBreadcrumbs'
import { getProfiles } from '@/lib/api/profiles'
import { getCitiesInState } from '@/lib/seo-cities'
import { SEO_INTENTS } from '@/lib/seo-intents'
import {
  findSeoNeighborhoodBySlugs,
  getNeighborhoodsForSeoCity,
  getSeoNeighborhoods,
} from '@/lib/seo-neighborhoods'
import { findSeoStateByUf } from '@/lib/seo-states'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

type Props = {
  params: Promise<{ citySlug: string; neighborhoodSlug: string }>
}

export async function generateStaticParams() {
  return getSeoNeighborhoods().map((item) => ({
    citySlug: item.slug,
    neighborhoodSlug: item.neighborhoodSlug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { citySlug, neighborhoodSlug } = await params
  const item = findSeoNeighborhoodBySlugs(citySlug, neighborhoodSlug)
  if (!item) return { title: 'Bairro não encontrado' }

  const canonical = `${SITE_URL}/cidade/${item.slug}/bairro/${item.neighborhoodSlug}`
  const title = `Acompanhantes em ${item.neighborhood}, ${item.city} - ${item.state}`
  const description = `Página local para acompanhantes em ${item.neighborhood}, ${item.city}/${item.state}. Descubra perfis, bairros próximos e como anunciar na CerejaVIP.`

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function NeighborhoodPage({ params }: Props) {
  const { citySlug, neighborhoodSlug } = await params
  const item = findSeoNeighborhoodBySlugs(citySlug, neighborhoodSlug)
  if (!item) notFound()

  const profiles = await getProfiles({
    filters: { state: item.state, city: item.city, category: 'acompanhante' },
    jsonTag: { field: 'neighborhoods', value: item.neighborhood },
    limit: 8,
    sort: 'default',
  })
  const cityProfiles =
    profiles.length > 0
      ? []
      : await getProfiles({
          filters: { state: item.state, city: item.city, category: 'acompanhante' },
          limit: 8,
          sort: 'default',
        })
  const visibleProfiles = profiles.length > 0 ? profiles : cityProfiles
  const exactNeighborhood = profiles.length > 0
  const stateInfo = findSeoStateByUf(item.state)
  const neighborhoods = getNeighborhoodsForSeoCity(item, 10).filter(
    (neighborhood) => neighborhood.neighborhoodSlug !== item.neighborhoodSlug
  )
  const nearbyCities = getCitiesInState(item.state, item.slug).slice(0, 6)
  const canonical = `${SITE_URL}/cidade/${item.slug}/bairro/${item.neighborhoodSlug}`
  const searchUrl = `/?state=${item.state}&city=${encodeURIComponent(item.city)}&category=acompanhante&neighborhood=${encodeURIComponent(item.neighborhood)}`

  const faq = [
    {
      question: `Como buscar acompanhantes em ${item.neighborhood}?`,
      answer: `Use esta página para chegar na cidade de ${item.city} com contexto de bairro. Quando houver perfis públicos marcados em ${item.neighborhood}, eles podem aparecer em destaque.`,
    },
    {
      question: `E se ainda não houver perfis no bairro ${item.neighborhood}?`,
      answer: `A página continua útil para descoberta orgânica e mostra caminhos para a cidade, bairros próximos e cadastro de novos anunciantes.`,
    },
    {
      question: `Posso anunciar especificamente em ${item.neighborhood}?`,
      answer: `Sim. Ao criar o perfil, informar cidade e bairros de atendimento ajuda visitantes locais a encontrarem seu anúncio com mais precisão.`,
    },
  ]

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      stateInfo && {
        '@type': 'ListItem',
        position: 2,
        name: stateInfo.label,
        item: `${SITE_URL}/estado/${stateInfo.slug}`,
      },
      { '@type': 'ListItem', position: stateInfo ? 3 : 2, name: item.city, item: `${SITE_URL}/cidade/${item.slug}` },
      { '@type': 'ListItem', position: stateInfo ? 4 : 3, name: item.neighborhood, item: canonical },
    ].filter(Boolean),
  }
  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Acompanhantes em ${item.neighborhood}, ${item.city}`,
    description: `Busca local por acompanhantes em ${item.neighborhood}, ${item.city}/${item.state}.`,
    url: canonical,
    inLanguage: 'pt-BR',
    isPartOf: { '@type': 'WebSite', name: 'CerejaVIP', url: SITE_URL },
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((faqItem) => ({
      '@type': 'Question',
      name: faqItem.question,
      acceptedAnswer: { '@type': 'Answer', text: faqItem.answer },
    })),
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <SeoBreadcrumbs
        items={[
          { label: 'Início', href: '/' },
          ...(stateInfo ? [{ label: stateInfo.label, href: `/estado/${stateInfo.slug}` }] : []),
          { label: item.city, href: `/cidade/${item.slug}` },
          { label: item.neighborhood },
        ]}
      />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">Busca por bairro</p>
        <h1 className="text-3xl font-bold text-white md:text-5xl">
          Acompanhantes em {item.neighborhood}, {item.city}
        </h1>
        <p className="mt-5 text-slate-300 md:text-lg">
          Página local para quem busca acompanhantes em {item.neighborhood}, com acesso à cidade de
          {` ${item.city}`}, bairros relacionados e cadastro de perfis para ganhar presença orgânica.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400 md:text-base">
          Bairros ajudam a transformar buscas genéricas em navegação realmente local. Mesmo quando ainda
          há poucos anúncios, a página cria um caminho indexável para visitantes e futuras anunciantes.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={searchUrl} rel="nofollow" className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-500">
            Ver busca do bairro
          </Link>
          <Link href={`/anunciar-em/${item.slug}`} className="inline-flex items-center justify-center rounded-lg border border-primary-500/70 px-6 py-3 font-semibold text-primary-100 transition hover:bg-primary-500/10">
            Anunciar em {item.city}
          </Link>
        </div>

        {visibleProfiles.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-white">
              {exactNeighborhood ? `Perfis em ${item.neighborhood}` : `Perfis em ${item.city}`}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {exactNeighborhood
                ? `Perfis públicos vinculados ao bairro ${item.neighborhood}.`
                : `Ainda não há perfis públicos marcados no bairro; veja opções da cidade.`}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visibleProfiles.map((profile, index) => (
                <ProfileCard key={profile.id} profile={profile} index={index} priority={index < 2} />
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
              Seja uma das primeiras em {item.neighborhood}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">
              Um perfil com bairro informado pode ocupar buscas locais antes da concorrência crescer em
              {` ${item.city}`}.
            </p>
          </section>
        )}

        <nav className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5" aria-label="Links locais">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
            Explore a região
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/cidade/${item.slug}`} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-primary-500 hover:text-white">
              Guia de {item.city}
            </Link>
            {SEO_INTENTS.map((intent) => (
              <Link key={intent.slug} href={`/cidade/${item.slug}/${intent.slug}`} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-primary-500 hover:text-white">
                {intent.label}
              </Link>
            ))}
            {neighborhoods.map((neighborhood) => (
              <Link key={neighborhood.neighborhoodSlug} href={`/cidade/${item.slug}/bairro/${neighborhood.neighborhoodSlug}`} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:border-primary-500 hover:text-white md:text-sm">
                {neighborhood.neighborhood}
              </Link>
            ))}
            {nearbyCities.map((city) => (
              <Link key={city.slug} href={`/cidade/${city.slug}`} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:border-primary-500 hover:text-white md:text-sm">
                {city.city}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
            Perguntas frequentes
          </h2>
          <div className="mt-4 space-y-3">
            {faq.map((faqItem) => (
              <details key={faqItem.question} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-100">
                  {faqItem.question}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{faqItem.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
