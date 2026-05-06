import Link from 'next/link'
import SeoBreadcrumbs from '@/components/SeoBreadcrumbs'
import { getPrioritySeoCities } from '@/lib/seo-cities'
import { getSeoNearMeIntent, type SeoNearMePage } from '@/lib/seo-near-me'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

export default function NearMeLandingPage({ page }: { page: SeoNearMePage }) {
  const intent = getSeoNearMeIntent(page)
  const cities = getPrioritySeoCities()
  const canonical = `${SITE_URL}/${page.slug}`
  const faq = [
    {
      question: `Como encontrar ${page.heading.toLowerCase()}?`,
      answer: `Escolha sua cidade ou estado e avance para uma página local da CerejaVIP. Assim a busca fica mais próxima do que você realmente procura.`,
    },
    {
      question: 'Por que usar páginas por cidade?',
      answer:
        'Páginas por cidade ajudam a organizar perfis, bairros, categorias e anunciantes locais, além de criar caminhos úteis para o Google descobrir o site.',
    },
    {
      question: 'Como aparecer nessas buscas?',
      answer:
        'Crie um perfil completo, informe cidade, categoria, fotos, descrição e disponibilidade. Quanto mais claro o perfil, melhor a experiência de quem encontra a página.',
    },
  ]
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: page.label, item: canonical },
    ],
  }
  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.heading,
    description: page.description,
    url: canonical,
    inLanguage: 'pt-BR',
    isPartOf: { '@type': 'WebSite', name: 'CerejaVIP', url: SITE_URL },
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <SeoBreadcrumbs items={[{ label: 'Início', href: '/' }, { label: page.label }]} />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">Busca por proximidade</p>
        <h1 className="text-3xl font-bold text-white md:text-5xl">{page.heading}</h1>
        <p className="mt-5 text-slate-300 md:text-lg">{page.description}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400 md:text-base">{page.audience}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" rel="nofollow" className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-500">
            Abrir busca
          </Link>
          <Link href="/register" className="inline-flex items-center justify-center rounded-lg border border-primary-500/70 px-6 py-3 font-semibold text-primary-100 transition hover:bg-primary-500/10">
            Criar perfil
          </Link>
        </div>

        <nav className="mt-8 rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 md:p-5" aria-label="Principais cidades">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300 md:text-base">
            Cidades mais buscadas
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Avance para páginas locais de {intent.label.toLowerCase()} com conteúdo por cidade e links de anúncio.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cities.map((city) => (
              <Link key={city.slug} href={`/cidade/${city.slug}/${intent.slug}`} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-primary-500 hover:text-white">
                {city.city}
              </Link>
            ))}
          </div>
        </nav>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Descoberta local', 'Páginas por cidade e bairro ajudam visitantes a chegar em resultados mais relevantes.'],
            ['Categorias alinhadas', `${intent.label} usa palavras e filtros coerentes com o objetivo de busca.`],
            ['Crescimento orgânico', 'Mesmo com poucos perfis, a estrutura cria rotas indexáveis para ganhar autoridade com o tempo.'],
          ].map(([heading, text]) => (
            <div key={heading} className="rounded-xl border border-slate-700/80 bg-slate-950/30 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-300">{heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{text}</p>
            </div>
          ))}
        </section>

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
