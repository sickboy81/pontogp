import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProfileCard from '@/components/ProfileCard'
import SeoBreadcrumbs from '@/components/SeoBreadcrumbs'
import { getProfiles } from '@/lib/api/profiles'
import { findSeoCityBySlug, getCitiesInState, SEO_CITIES } from '@/lib/seo-cities'
import { findSeoStateByUf } from '@/lib/seo-states'
import { findSeoIntentBySlug, getIntentFilters, SEO_INTENTS } from '@/lib/seo-intents'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

type Props = {
  params: Promise<{ citySlug: string; intentSlug: string }>
}

export async function generateStaticParams() {
  return SEO_CITIES.flatMap((city) =>
    SEO_INTENTS.map((intent) => ({ citySlug: city.slug, intentSlug: intent.slug }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { citySlug, intentSlug } = await params
  const city = findSeoCityBySlug(citySlug)
  const intent = findSeoIntentBySlug(intentSlug)
  if (!city || !intent) return { title: 'Página não encontrada' }

  const canonical = `${SITE_URL}/cidade/${city.slug}/${intent.slug}`
  const title = `${intent.titlePrefix} em ${city.city} - ${city.state}`
  const description = `${intent.label} em ${city.city}/${city.state}: ${intent.description}. Guia local da CerejaVIP com filtros, links regionais e cadastro para anunciantes.`

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
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function CityIntentPage({ params }: Props) {
  const { citySlug, intentSlug } = await params
  const city = findSeoCityBySlug(citySlug)
  const intent = findSeoIntentBySlug(intentSlug)
  if (!city || !intent) notFound()

  const filters = { state: city.state, city: city.city, ...getIntentFilters(intent) }
  const profiles = await getProfiles({ filters, limit: 8, sort: 'default' })
  const stateInfo = findSeoStateByUf(city.state)
  const otherCities = getCitiesInState(city.state, city.slug).slice(0, 8)
  const canonical = `${SITE_URL}/cidade/${city.slug}/${intent.slug}`
  const pageTitle = `${intent.titlePrefix} em ${city.city} (${city.state})`
  const advertiserUrl = `/anunciar-em/${city.slug}`
  const searchUrl = `/?state=${city.state}&city=${encodeURIComponent(city.city)}${
    intent.category ? `&category=${intent.category}` : ''
  }${intent.gender ? `&gender=${intent.gender}` : ''}`

  const faq = [
    {
      question: `Como encontrar ${intent.plural} em ${city.city}?`,
      answer: `Use a página local de ${city.city} para comparar perfis, conferir disponibilidade e navegar por categorias relacionadas. A CerejaVIP organiza a busca por cidade, estado e intenção para facilitar a descoberta.`,
    },
    {
      question: `Ainda vale anunciar em ${city.city} se a página tiver poucos perfis?`,
      answer: `Sim. Cidades com pouca concorrência podem receber tráfego orgânico antes de terem muitos anúncios. Ser uma das primeiras pessoas anunciando em ${city.city} ajuda a ocupar espaço local desde cedo.`,
    },
    {
      question: `Esta página é atualizada?`,
      answer: `Sim. Quando novos perfis públicos entram na categoria ${intent.label.toLowerCase()}, eles podem aparecer nesta página e fortalecer o conteúdo local da cidade.`,
    },
  ]

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: `${intent.label} em ${city.city}/${city.state}: ${intent.description}.`,
    url: canonical,
    inLanguage: 'pt-BR',
    isPartOf: { '@type': 'WebSite', name: 'CerejaVIP', url: SITE_URL },
  }
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
      { '@type': 'ListItem', position: stateInfo ? 3 : 2, name: city.city, item: `${SITE_URL}/cidade/${city.slug}` },
      { '@type': 'ListItem', position: stateInfo ? 4 : 3, name: intent.label, item: canonical },
    ].filter(Boolean),
  }
  const itemListJsonLd =
    profiles.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: pageTitle,
          itemListElement: profiles.map((profile, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${SITE_URL}/perfil/${profile.id}`,
            name: profile.name,
          })),
        }
      : null

  return (
      <div className="mx-auto max-w-5xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}
      <SeoBreadcrumbs
        items={[
          { label: 'Início', href: '/' },
          ...(stateInfo ? [{ label: stateInfo.label, href: `/estado/${stateInfo.slug}` }] : []),
          { label: city.city, href: `/cidade/${city.slug}` },
          { label: intent.label },
        ]}
      />

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">
          Guia local por categoria
        </p>
        <h1 className="text-3xl font-bold text-white md:text-5xl">
          {intent.titlePrefix} em {city.city} <span className="text-primary-500">({city.state})</span>
        </h1>
        <p className="mt-5 text-slate-300 md:text-lg">
          Encontre {intent.searchPhrase} em {city.city} com navegação discreta, filtros por cidade e
          links úteis para comparar perfis, conhecer categorias relacionadas e anunciar com presença local.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400 md:text-base">
          Esta página foi criada para quem procura {intent.plural} em {city.city}: {intent.description}. É
          {` ${intent.audienceLine}`}, com conteúdo local e caminhos claros para busca ou cadastro.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={searchUrl}
            rel="nofollow"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-500"
          >
            Ver busca filtrada
          </Link>
          <Link
            href={advertiserUrl}
            className="inline-flex items-center justify-center rounded-lg border border-primary-500/70 px-6 py-3 font-semibold text-primary-100 transition hover:bg-primary-500/10"
          >
            Anunciar em {city.city}
          </Link>
        </div>

        {profiles.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-white">Perfis nesta categoria</h2>
            <p className="mt-1 text-sm text-slate-400">
              Perfis públicos encontrados para {intent.label.toLowerCase()} em {city.city}.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {profiles.map((profile, index) => (
                <ProfileCard key={profile.id} profile={profile} index={index} priority={index < 2} />
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
              Seja destaque em {city.city}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">
              Ainda há espaço para novos perfis de {intent.plural} em {city.city}. Para anunciantes, isso
              representa baixa concorrência local e uma página já preparada para descoberta orgânica.
            </p>
            <Link
              href={advertiserUrl}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
            >
              Criar perfil para {city.city}
            </Link>
          </section>
        )}

        <nav className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5" aria-label="Links relacionados">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
            Explore mais em {city.city}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/cidade/${city.slug}`} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-primary-500 hover:text-white">
              Guia principal
            </Link>
            {SEO_INTENTS.filter((item) => item.slug !== intent.slug).map((item) => (
              <Link key={item.slug} href={`/cidade/${city.slug}/${item.slug}`} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-primary-500 hover:text-white">
                {item.label}
              </Link>
            ))}
            {stateInfo && (
              <Link href={`/estado/${stateInfo.slug}`} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-primary-500 hover:text-white">
                {stateInfo.label}
              </Link>
            )}
          </div>
          {otherCities.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Cidades próximas no estado</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {otherCities.map((item) => (
                  <Link key={item.slug} href={`/cidade/${item.slug}/${intent.slug}`} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:border-primary-500 hover:text-white md:text-sm">
                    {item.city}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
            Perguntas frequentes
          </h2>
          <div className="mt-4 space-y-3">
            {faq.map((item) => (
              <details key={item.question} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-100">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
