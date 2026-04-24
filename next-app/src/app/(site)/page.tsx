import type { Metadata } from 'next'
import { Suspense } from 'react'
import HomeClient from '@/components/HomeClient'
import { getHomeSearchParamsURL, resolveHomeCanonical } from '@/lib/seo-home'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

const DEFAULT_TITLE = 'CerejaVIP - Acompanhantes Brasil'
const DEFAULT_DESCRIPTION =
  'Plataforma de classificados premium para profissionais de entretenimento. Encontre acompanhantes, massagistas e atendimento online com segurança.'

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = getHomeSearchParamsURL(await searchParams)
  const { canonical, noindex } = resolveHomeCanonical(sp)
  const base: Metadata = {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    alternates: { canonical },
  }
  if (noindex) {
    return {
      ...base,
      robots: { index: false, follow: true },
      openGraph: {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        url: `${SITE_URL}/`,
        type: 'website',
        images: [{ url: `${SITE_URL}/logo-cerejavip.png` }],
      },
      twitter: {
        card: 'summary_large_image',
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
      },
    }
  }
  return {
    ...base,
    openGraph: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      url: canonical,
      type: 'website',
      images: [{ url: `${SITE_URL}/logo-cerejavip.png` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    },
  }
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-slate-800">
                <div className="aspect-[3/4] bg-slate-700" />
                <div className="h-4 w-3/4 bg-slate-700 p-4" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <HomeClient />
    </Suspense>
  )
}
