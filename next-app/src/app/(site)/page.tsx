import { Suspense } from 'react'
import HomeClient from '@/components/HomeClient'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

export const metadata = {
  title: 'CerejaVIP - Acompanhantes Brasil',
  description: 'Plataforma de classificados premium para profissionais de entretenimento. Encontre acompanhantes, massagistas e atendimento online com segurança.',
  openGraph: {
    title: 'CerejaVIP - Acompanhantes Brasil',
    description: 'Plataforma de classificados premium para profissionais de entretenimento.',
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/logo-cerejavip.png` }],
  },
}

export default function HomePage() {
  return (
    <Suspense fallback={
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
    }>
      <HomeClient />
    </Suspense>
  )
}
