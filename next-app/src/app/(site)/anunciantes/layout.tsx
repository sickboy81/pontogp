import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

export const metadata: Metadata = {
  title: 'Crie seu perfil de acompanhante | CerejaVIP',
  description: 'Crie seu perfil grátis no CerejaVIP e divulgue fotos, serviços, valores e contatos. Use Cereja Stories, Link na Bio, mensagens e recursos conforme o plano.',
  alternates: { canonical: `${SITE_URL}/anunciantes` },
  openGraph: {
    title: 'Crie e divulgue seu perfil no CerejaVIP',
    description: 'Perfil gratuito, Cereja Stories, Link na Bio, mensagens, verificação e planos com diferentes limites de mídia, bumps e estatísticas.',
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
