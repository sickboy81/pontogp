import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProfileCard from '@/components/ProfileCard'
import { getProfiles } from '@/lib/api/profiles'
import { findSeoCityBySlug, getCitiesInState, SEO_CITIES } from '@/lib/seo-cities'
import { findSeoStateByUf } from '@/lib/seo-states'
import { SEO_INTENTS } from '@/lib/seo-intents'
import { getPublicProfileUrl } from '@/lib/profile-url'
import { getLocationFaq, getLocationHeroKicker, getLocationMetaDescription, getLocationMetaTitle, getLocationSeoCopy } from '@/lib/seo-copy'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

type Props = {
  params: Promise<{ citySlug: string }>
}

export async function generateStaticParams() {
  return SEO_CITIES.map((item) => ({ citySlug: item.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { citySlug } = await params
  const city = findSeoCityBySlug(citySlug)
  if (!city) return { title: 'Cidade não encontrada' }

  const title = getLocationMetaTitle(city.state, city.city, 'city')
  const description = getLocationMetaDescription(city.state, city.city, 'city')
  const canonical = `${SITE_URL}/cidade/${city.slug}`

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

export default async function CityLandingPage({ params }: Props) {
  const { citySlug } = await params
  const city = findSeoCityBySlug(citySlug)
  if (!city) notFound()

  const filteredHref = `/?state=${city.state}&city=${encodeURIComponent(city.city)}&category=acompanhante&gender=mulher`
  const copy = getLocationSeoCopy(city.state, city.city, { localSeoLine: city.localSeoLine })
  const stateInfo = findSeoStateByUf(city.state)
  const otherCities = getCitiesInState(city.state, city.slug)
  const kicker = getLocationHeroKicker(city.state, city.city, 'city')
  const faq = getLocationFaq(city.state, city.city, 'city')
  const canonical = `${SITE_URL}/cidade/${city.slug}`
  const pageTitle = getLocationMetaTitle(city.state, city.city, 'city')
  const pageDescription = getLocationMetaDescription(city.state, city.city, 'city')
  const cityProfiles = await getProfiles({
    filters: {
      state: city.state,
      city: city.city,
    },
    limit: 8,
    sort: 'default',
  })
  const nearbyProfiles =
    cityProfiles.length > 0
      ? []
      : await getProfiles({
          filters: {
            state: city.state,
          },
          limit: 8,
          sort: 'default',
        })
  const profiles = cityProfiles.length > 0 ? cityProfiles : nearbyProfiles
  const hasExactCityProfiles = cityProfiles.length > 0
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: `${SITE_URL}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `Acompanhantes em ${city.city}`,
        item: canonical,
      },
    ],
  }
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageDescription,
    url: canonical,
    isPartOf: {
      '@type': 'WebSite',
      name: 'CerejaVIP',
      url: SITE_URL,
    },
    inLanguage: 'pt-BR',
  }
  const itemListJsonLd =
    profiles.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: hasExactCityProfiles
            ? `Perfis em ${city.city} (${city.state})`
            : `Perfis próximos em ${city.state}`,
          itemListElement: profiles.slice(0, 8).map((profile, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: getPublicProfileUrl(profile, SITE_URL),
            name: profile.name,
          })),
        }
      : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">{kicker}</p>
        <h1 className="text-3xl font-bold text-white md:text-5xl">
          Acompanhantes em {city.city} <span className="text-primary-500">({city.state})</span>
        </h1>
        <p className="mt-5 text-slate-300 md:text-lg">
          {copy.intro}
        </p>
        {copy.localLine && (
          <p className="mt-3 text-sm leading-relaxed text-slate-400 md:text-base">
            {copy.localLine}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={filteredHref}
            rel="nofollow"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-500"
          >
            Ver resultados em {city.city}
          </Link>
          <Link
            href="/anunciantes"
            className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Ver página de anunciantes
          </Link>
        </div>

        <div className="mt-8 space-y-3 text-sm leading-relaxed text-slate-300 md:text-base">
          <p>
            {copy.p1}
          </p>
          <p>
            {copy.p2}
          </p>
          <p>
            Esta página reúne perfis, filtros de busca e links regionais para {city.city}. Quando
            há anúncios ativos na cidade, eles aparecem abaixo com foto, categoria, preço inicial e
            sinais de disponibilidade; se a cidade ainda estiver sem anúncios públicos, mostramos
            opções próximas em {city.state} para manter a navegação útil.
          </p>
        </div>

        {profiles.length > 0 ? (
          <section className="mt-8" aria-labelledby="city-profiles-heading">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="city-profiles-heading" className="text-xl font-semibold text-white">
                  {hasExactCityProfiles
                    ? `Perfis ativos em ${city.city}`
                    : `Perfis próximos em ${city.state}`}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {hasExactCityProfiles
                    ? `Anúncios encontrados para ${city.city} (${city.state}), ordenados por destaque e atualização.`
                    : `Ainda não há anúncios públicos para o filtro exato em ${city.city}; veja opções ativas no mesmo estado.`}
                </p>
              </div>
              <Link href={filteredHref} rel="nofollow" className="text-sm font-semibold text-primary-400 hover:text-primary-300">
                Ver todos os filtros
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {profiles.map((profile, index) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  index={index}
                  planColor={profile.visual_highlight ? '#dc2626' : undefined}
                  priority={index < 2}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
              Busca local em {city.city}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">
              Ainda não há perfis públicos disponíveis para este filtro exato em {city.city}. Use a
              busca geral para ver cidades próximas em {city.state}, ajustar categoria, gênero,
              preço e disponibilidade online.
            </p>
            <Link
              href={filteredHref}
              rel="nofollow"
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-primary-500 hover:text-white"
            >
              Abrir busca em {city.city}
            </Link>
          </section>
        )}

        <nav
          className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5"
          aria-label={`Categorias em ${city.city}`}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
            Buscas relacionadas em {city.city}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Páginas por intenção ajudam visitantes e anunciantes a encontrar exatamente o que procuram.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SEO_INTENTS.map((intent) => (
              <Link
                key={intent.slug}
                href={`/cidade/${city.slug}/${intent.slug}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition hover:border-primary-500 hover:text-white"
              >
                {intent.label}
              </Link>
            ))}
            <Link
              href={`/anunciar-em/${city.slug}`}
              className="inline-flex items-center gap-1 rounded-lg border border-primary-500/70 px-3 py-2 text-sm font-semibold text-primary-100 transition hover:bg-primary-500/10"
            >
              Anunciar em {city.city}
            </Link>
          </div>
        </nav>

        {(stateInfo || otherCities.length > 0) && (
          <nav
            className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5"
            aria-label={`Links relacionados a ${city.city}`}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
              Explore na região
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-300">
              {stateInfo && (
                <Link
                  href={`/estado/${stateInfo.slug}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 transition hover:border-primary-500 hover:text-white"
                >
                  Guia {stateInfo.label} ({stateInfo.uf})
                </Link>
              )}
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 transition hover:border-primary-500 hover:text-white"
              >
                Busca geral
              </Link>
            </div>
            {otherCities.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500">Outras cidades no estado</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {otherCities.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/cidade/${c.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-primary-500 hover:text-white md:text-sm"
                    >
                      {c.city}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>
        )}

        <details className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/40 p-4 md:p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-wide text-primary-300">
            Leia mais
          </summary>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300 md:text-base">
            <p>
              {copy.readMore[0]}
            </p>
            <p>
              {copy.readMore[1]}
            </p>
            <p>
              {copy.readMore[2]}
            </p>
          </div>
        </details>

        <div className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
            Perguntas frequentes em {city.city}
          </h2>
          <div className="mt-4 space-y-3">
            {faq.map((item) => (
              <details key={item.question} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-100">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
