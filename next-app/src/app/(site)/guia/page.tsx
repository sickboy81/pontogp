import type { Metadata } from 'next'
import Link from 'next/link'
import { SEO_GUIDES } from '@/lib/seo-guides'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

export const metadata: Metadata = {
  title: 'Guias CerejaVIP - segurança, anúncios e descoberta local',
  description:
    'Guias da CerejaVIP para visitantes e anunciantes: segurança, criação de perfil, fotos, privacidade e divulgação em cidades.',
  alternates: { canonical: `${SITE_URL}/guia` },
}

export default function GuiaPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">Conteúdo editorial</p>
        <h1 className="text-3xl font-bold text-white md:text-5xl">Guias CerejaVIP</h1>
        <p className="mt-5 max-w-3xl text-slate-300 md:text-lg">
          Conteúdo prático para quem busca acompanhantes com mais segurança e para anunciantes que querem
          construir presença local com perfis completos e discretos.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {SEO_GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guia/${guide.slug}`}
              className="rounded-xl border border-slate-700/80 bg-slate-950/30 p-4 transition hover:border-primary-500 hover:bg-slate-900/70"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-primary-300">
                {guide.audience}
              </span>
              <h2 className="mt-2 text-lg font-semibold text-white">{guide.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{guide.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
