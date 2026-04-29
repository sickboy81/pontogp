import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

export const metadata: Metadata = {
  title: 'Anuncie Grátis - Acompanhantes Brasil | CerejaVIP',
  description: 'Anuncie como acompanhante na CerejaVIP. Perfil grátis com galeria HD, stories, link na bio, dashboard analytics, chat interno e verificação de identidade. Comece em 2 minutos.',
  alternates: { canonical: `${SITE_URL}/anunciantes` },
  openGraph: {
    title: 'Anuncie Grátis - Acompanhantes Brasil | CerejaVIP',
    description: 'Plataforma completa para acompanhantes. Crie seu perfil grátis com galeria HD, stories, analytics e chat interno.',
    url: `${SITE_URL}/anunciantes`,
    type: 'website',
  },
}

export default function AnunciantesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
