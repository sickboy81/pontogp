import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SeoBreadcrumbs from '@/components/SeoBreadcrumbs'
import { SEO_CITIES } from '@/lib/seo-cities'
import { SEO_INTENTS } from '@/lib/seo-intents'
import { findSeoStateBySlug, SEO_STATES } from '@/lib/seo-states'
import { getLocationFaq, getLocationHeroKicker, getLocationMetaDescription, getLocationMetaTitle, getLocationSeoCopy } from '@/lib/seo-copy'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

type Props = {
  params: Promise<{ stateSlug: string }>
}

export async function generateStaticParams() {
  return SEO_STATES.map((item) => ({ stateSlug: item.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug } = await params
  const state = findSeoStateBySlug(stateSlug)
  if (!state) return { title: 'Estado não encontrado' }

  const title = getLocationMetaTitle(state.uf, state.label, 'state')
  const description = getLocationMetaDescription(state.uf, state.label, 'state')
  const canonical = `${SITE_URL}/estado/${state.slug}`

  return {
    title,
    description,
    alternates: { canonical },
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

export default async function StateLandingPage({ params }: Props) {
  const { stateSlug } = await params
  const state = findSeoStateBySlug(stateSlug)
  if (!state) notFound()

  const filteredHref = `/?state=${state.uf}&category=acompanhante&gender=mulher`
  const copy = getLocationSeoCopy(state.uf, state.label)
  const citiesInState = SEO_CITIES.filter((c) => c.state === state.uf)
  const kicker = getLocationHeroKicker(state.uf, state.label, 'state')
  const faq = getLocationFaq(state.uf, state.label, 'state')
  const canonical = `${SITE_URL}/estado/${state.slug}`
  const pageTitle = getLocationMetaTitle(state.uf, state.label, 'state')
  const pageDescription = getLocationMetaDescription(state.uf, state.label, 'state')
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
        name: `Acompanhantes em ${state.label}`,
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
      <SeoBreadcrumbs items={[{ label: 'Início', href: '/' }, { label: state.label }]} />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">{kicker}</p>
        <h1 className="text-3xl font-bold text-white md:text-5xl">
          Acompanhantes em {state.label} <span className="text-primary-500">({state.uf})</span>
        </h1>
        <p className="mt-5 text-slate-300 md:text-lg">
          {copy.intro}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={filteredHref}
            rel="nofollow"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-500"
          >
            Ver resultados em {state.label}
          </Link>
          <Link
            href="/anunciantes"
            className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Ver página de anunciantes
          </Link>
        </div>

        <nav className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5" aria-label={`Categorias em ${state.label}`}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
            Buscas por categoria em {state.label}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Escolha uma categoria para encontrar opções mais alinhadas ao que você procura.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SEO_INTENTS.map((intent) => (
              <Link
                key={intent.slug}
                href={`/estado/${state.slug}/${intent.slug}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition hover:border-primary-500 hover:text-white"
              >
                {intent.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-8 space-y-3 text-sm leading-relaxed text-slate-300 md:text-base">
          <p>
            {copy.p1}
          </p>
          <p>
            {copy.p2}
          </p>
        </div>

        {citiesInState.length > 0 && (
          <nav
            className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5"
            aria-label={`Cidades em ${state.label}`}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
              Cidades com guia em {state.label}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Atalhos para buscas e textos locais na CerejaVIP.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {citiesInState.map((c) => (
                <div key={c.slug} className="flex flex-wrap gap-2">
                  <Link
                    href={`/cidade/${c.slug}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition hover:border-primary-500 hover:text-white"
                  >
                    {c.city} <span className="text-slate-500">({c.state})</span>
                  </Link>
                  <Link
                    href={`/anunciar-em/${c.slug}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-primary-500/60 px-3 py-2 text-sm text-primary-100 transition hover:bg-primary-500/10"
                  >
                    Anunciar
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Link href="/" className="text-sm text-primary-400 hover:text-primary-300">
                Voltar à busca geral
              </Link>
            </div>
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
            Perguntas frequentes em {state.label}
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
