import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findSeoCityBySlug, SEO_CITIES } from '@/lib/seo-cities'

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

  const title = `Acompanhantes em ${city.city} - ${city.state}`
  const description = `Perfis em destaque em ${city.city}/${city.state}. Filtre por categoria, gênero, verificação e disponibilidade na CerejaVIP.`
  const canonical = `${SITE_URL}/cidade/${city.slug}`

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

export default async function CityLandingPage({ params }: Props) {
  const { citySlug } = await params
  const city = findSeoCityBySlug(citySlug)
  if (!city) notFound()

  const filteredHref = `/?state=${city.state}&city=${encodeURIComponent(city.city)}&category=acompanhante&gender=mulher`

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">Guia local</p>
        <h1 className="text-3xl font-bold text-white md:text-5xl">
          Acompanhantes em {city.city} <span className="text-primary-500">({city.state})</span>
        </h1>
        <p className="mt-5 text-slate-300 md:text-lg">
          Explore perfis ativos em {city.city}, compare estilos de atendimento e use filtros avançados para encontrar resultados mais relevantes.
          A listagem e atualizada com frequência para facilitar sua busca.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={filteredHref}
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

        <div className="mt-8 space-y-3 text-sm leading-relaxed text-slate-400 md:text-base">
          <p>
            Para resultados mais precisos, combine filtros de categoria, gênero, faixa de preço e perfis verificados.
            Isso ajuda a reduzir o tempo de busca e melhora a experiência de navegação.
          </p>
          <p>
            Se você anuncia em {city.city}, manter seu perfil completo e atualizado aumenta a exposição e a taxa de contato.
            Fotos de qualidade, descrição objetiva e agenda ativa costumam gerar melhor desempenho.
          </p>
        </div>
      </div>
    </div>
  )
}
