import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProfileCard from '@/components/ProfileCard'
import SeoBreadcrumbs from '@/components/SeoBreadcrumbs'
import { getProfiles } from '@/lib/api/profiles'
import { getCitiesInState } from '@/lib/seo-cities'
import { findSeoIntentBySlug, getIntentFilters, SEO_INTENTS } from '@/lib/seo-intents'
import { findSeoStateBySlug, SEO_STATES } from '@/lib/seo-states'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

type Props = {
  params: Promise<{ stateSlug: string; intentSlug: string }>
}

export async function generateStaticParams() {
  return SEO_STATES.flatMap((state) =>
    SEO_INTENTS.map((intent) => ({ stateSlug: state.slug, intentSlug: intent.slug }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug, intentSlug } = await params
  const state = findSeoStateBySlug(stateSlug)
  const intent = findSeoIntentBySlug(intentSlug)
  if (!state || !intent) return { title: 'Página não encontrada' }

  const canonical = `${SITE_URL}/estado/${state.slug}/${intent.slug}`
  const title = `${intent.titlePrefix} em ${state.label} - ${state.uf}`
  const description = `${intent.label} em ${state.label}: páginas por cidade, filtros locais e perfis públicos para descoberta orgânica na CerejaVIP.`

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

export default async function StateIntentPage({ params }: Props) {
  const { stateSlug, intentSlug } = await params
  const state = findSeoStateBySlug(stateSlug)
  const intent = findSeoIntentBySlug(intentSlug)
  if (!state || !intent) notFound()

  const filters = { state: state.uf, ...getIntentFilters(intent) }
  const profiles = await getProfiles({ filters, limit: 8, sort: 'default' })
  const cities = getCitiesInState(state.uf)
  const canonical = `${SITE_URL}/estado/${state.slug}/${intent.slug}`
  const searchUrl = `/?state=${state.uf}${intent.category ? `&category=${intent.category}` : ''}${
    intent.gender ? `&gender=${intent.gender}` : ''
  }`
  const pageTitle = `${intent.titlePrefix} em ${state.label}`

  const faq = [
    {
      question: `Onde encontrar ${intent.plural} em ${state.label}?`,
      answer: `A CerejaVIP organiza páginas de ${intent.plural} por estado e cidade. Comece por ${state.label}, escolha uma cidade e use os filtros locais para chegar em perfis mais relevantes.`,
    },
    {
      question: `As cidades sem perfis continuam aparecendo?`,
      answer: `Sim. As páginas locais continuam indexáveis para ajudar a construir presença orgânica e atrair os primeiros anunciantes em cada região.`,
    },
    {
      question: `Como anunciar para buscas em ${state.label}?`,
      answer: `Crie um perfil, selecione cidade, categoria e informações de atendimento. Páginas locais com pouca concorrência podem gerar descoberta orgânica antes de ficarem saturadas.`,
    },
  ]

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: state.label, item: `${SITE_URL}/estado/${state.slug}` },
      { '@type': 'ListItem', position: 3, name: intent.label, item: canonical },
    ],
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: `${intent.label} em ${state.label}: ${intent.description}.`,
    url: canonical,
    inLanguage: 'pt-BR',
    isPartOf: { '@type': 'WebSite', name: 'CerejaVIP', url: SITE_URL },
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <SeoBreadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: state.label, href: `/estado/${state.slug}` },
          { label: intent.label },
        ]}
      />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">Busca estadual</p>
        <h1 className="text-3xl font-bold text-white md:text-5xl">
          {intent.titlePrefix} em {state.label} <span className="text-primary-500">({state.uf})</span>
        </h1>
        <p className="mt-5 text-slate-300 md:text-lg">
          Navegue por {intent.searchPhrase} em {state.label} com páginas locais por cidade, filtros de
          categoria e caminhos para descobrir perfis ou anunciar onde ainda há baixa concorrência.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400 md:text-base">
          Esta página fortalece buscas regionais relacionadas a {intent.plural}. Ela conecta o estado,
          cidades importantes e páginas de anúncio para ampliar a descoberta orgânica da CerejaVIP.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={searchUrl} rel="nofollow" className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-500">
            Ver busca filtrada
          </Link>
          <Link href={`/estado/${state.slug}`} className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800">
            Guia do estado
          </Link>
        </div>

        {profiles.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-white">Perfis em {state.label}</h2>
            <p className="mt-1 text-sm text-slate-400">Perfis públicos encontrados nesta categoria no estado.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {profiles.map((profile, index) => (
                <ProfileCard key={profile.id} profile={profile} index={index} priority={index < 2} />
              ))}
            </div>
          </section>
        )}

        <nav className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5" aria-label={`Cidades em ${state.label}`}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
            Cidades para {intent.label.toLowerCase()}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Cada cidade tem uma página própria para buscar e também uma página para captar novos anunciantes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cities.map((city) => (
              <Link key={city.slug} href={`/cidade/${city.slug}/${intent.slug}`} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-primary-500 hover:text-white">
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
