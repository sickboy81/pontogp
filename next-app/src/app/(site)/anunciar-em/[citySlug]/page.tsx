import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SeoBreadcrumbs from '@/components/SeoBreadcrumbs'
import { findSeoCityBySlug, getCitiesInState, SEO_CITIES } from '@/lib/seo-cities'
import { findSeoStateByUf } from '@/lib/seo-states'
import { SEO_INTENTS } from '@/lib/seo-intents'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

type Props = {
  params: Promise<{ citySlug: string }>
}

export async function generateStaticParams() {
  return SEO_CITIES.map((city) => ({ citySlug: city.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { citySlug } = await params
  const city = findSeoCityBySlug(citySlug)
  if (!city) return { title: 'Cidade não encontrada' }

  const canonical = `${SITE_URL}/anunciar-em/${city.slug}`
  const title = `Anunciar em ${city.city} - divulgar perfil na CerejaVIP`
  const description = `Crie um perfil para anunciar em ${city.city}/${city.state}. Página para acompanhantes, massagistas e atendimento online ganharem presença local na CerejaVIP.`

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

export default async function AdvertiseCityPage({ params }: Props) {
  const { citySlug } = await params
  const city = findSeoCityBySlug(citySlug)
  if (!city) notFound()

  const stateInfo = findSeoStateByUf(city.state)
  const nearbyCities = getCitiesInState(city.state, city.slug).slice(0, 8)
  const canonical = `${SITE_URL}/anunciar-em/${city.slug}`
  const title = `Anunciar em ${city.city}`

  const faq = [
    {
      question: `Como anunciar em ${city.city} na CerejaVIP?`,
      answer: `Crie sua conta, complete o perfil com fotos, descrição, cidade, categoria e meios de contato. Um perfil completo ajuda a aparecer melhor para quem busca em ${city.city}.`,
    },
    {
      question: `Vale a pena divulgar perfil em uma cidade com poucos anúncios?`,
      answer: `Sim. Quando ainda há poucos perfis em ${city.city}, a concorrência local tende a ser menor e a página pode crescer junto com a busca orgânica da cidade.`,
    },
    {
      question: 'Quais categorias podem anunciar?',
      answer: 'A CerejaVIP organiza páginas para acompanhantes, acompanhantes femininas, acompanhantes trans, massagistas e atendimento online, sempre com foco em discrição e navegação local.',
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
  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: `Página para anunciar perfil em ${city.city}/${city.state} na CerejaVIP.`,
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
      { '@type': 'ListItem', position: stateInfo ? 4 : 3, name: title, item: canonical },
    ].filter(Boolean),
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
          { label: city.city, href: `/cidade/${city.slug}` },
          { label: 'Anunciar' },
        ]}
      />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">
          Captação de anunciantes
        </p>
        <h1 className="text-3xl font-bold text-white md:text-5xl">
          Anunciar em {city.city} <span className="text-primary-500">({city.state})</span>
        </h1>
        <p className="mt-5 text-slate-300 md:text-lg">
          Divulgue seu perfil na CerejaVIP e construa presença local em {city.city}. A página da cidade
          já está preparada para receber buscas orgânicas por acompanhantes, massagistas e atendimento online.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400 md:text-base">
          Para quem está começando, entrar cedo em uma cidade pode ser uma vantagem: menos concorrência,
          mais espaço nos links internos e uma página local pronta para descoberta no Google.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-500"
          >
            Criar perfil grátis
          </Link>
          <Link
            href={`/cidade/${city.slug}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Ver guia da cidade
          </Link>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Presença local', `Página dedicada para ${city.city} com links internos e conteúdo regional.`],
            ['Categorias certas', 'Acompanhantes, massagistas, trans e atendimento online em rotas específicas.'],
            ['Perfil completo', 'Fotos, descrição, localização, preços e contatos ajudam a converter visitantes.'],
          ].map(([heading, text]) => (
            <div key={heading} className="rounded-xl border border-slate-700/80 bg-slate-950/30 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300">{heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{text}</p>
            </div>
          ))}
        </section>

        <nav className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5" aria-label="Categorias para anunciar">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
            Categorias em {city.city}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {SEO_INTENTS.map((intent) => (
              <Link key={intent.slug} href={`/cidade/${city.slug}/${intent.slug}`} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-primary-500 hover:text-white">
                {intent.label}
              </Link>
            ))}
            {stateInfo && (
              <Link href={`/estado/${stateInfo.slug}`} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-primary-500 hover:text-white">
                {stateInfo.label}
              </Link>
            )}
          </div>
          {nearbyCities.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Outras cidades do estado</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {nearbyCities.map((item) => (
                  <Link key={item.slug} href={`/anunciar-em/${item.slug}`} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:border-primary-500 hover:text-white md:text-sm">
                    Anunciar em {item.city}
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
