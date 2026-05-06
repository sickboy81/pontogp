import type { Metadata } from 'next'
import NearMeLandingPage from '@/components/NearMeLandingPage'
import { findSeoNearMePage } from '@/lib/seo-near-me'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'
const page = findSeoNearMePage('acompanhantes-trans-perto-de-mim')

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description,
  alternates: { canonical: `${SITE_URL}/acompanhantes-trans-perto-de-mim` },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
}

export default function AcompanhantesTransPertoDeMimPage() {
  return <NearMeLandingPage page={page!} />
}
