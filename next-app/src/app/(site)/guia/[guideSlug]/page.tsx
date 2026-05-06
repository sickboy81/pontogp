import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findSeoGuideBySlug, SEO_GUIDES } from '@/lib/seo-guides'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

type Props = {
  params: Promise<{ guideSlug: string }>
}

export async function generateStaticParams() {
  return SEO_GUIDES.map((guide) => ({ guideSlug: guide.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guideSlug } = await params
  const guide = findSeoGuideBySlug(guideSlug)
  if (!guide) return { title: 'Guia não encontrado' }
  const canonical = `${SITE_URL}/guia/${guide.slug}`

  return {
    title: guide.title,
    description: guide.description,
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
      title: guide.title,
      description: guide.description,
      url: canonical,
      type: 'article',
    },
  }
}

export default async function GuiaDetalhePage({ params }: Props) {
  const { guideSlug } = await params
  const guide = findSeoGuideBySlug(guideSlug)
  if (!guide) notFound()

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    inLanguage: 'pt-BR',
    author: { '@type': 'Organization', name: 'CerejaVIP' },
    publisher: { '@type': 'Organization', name: 'CerejaVIP', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/guia/${guide.slug}`,
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Link href="/guia" className="text-sm font-semibold text-primary-400 hover:text-primary-300">
        Guias
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-white md:text-5xl">{guide.title}</h1>
      <p className="mt-5 text-slate-300 md:text-lg">{guide.description}</p>
      <div className="mt-8 space-y-6">
        {guide.sections.map((section) => (
          <section key={section.heading} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-xl font-semibold text-white">{section.heading}</h2>
            <p className="mt-3 leading-relaxed text-slate-300">{section.body}</p>
          </section>
        ))}
      </div>
      <div className="mt-8 rounded-xl border border-primary-500/40 bg-primary-500/10 p-5">
        <h2 className="text-lg font-semibold text-white">Próximo passo</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Explore as páginas por cidade ou crie um perfil para começar a construir presença local na CerejaVIP.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/cidade/sao-paulo-sp" className="rounded-lg border border-slate-600 px-4 py-2 text-center text-sm font-semibold text-slate-200 hover:border-primary-500">
            Ver cidades
          </Link>
          <Link href="/register" className="rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-primary-500">
            Criar perfil
          </Link>
        </div>
      </div>
    </article>
  )
}
