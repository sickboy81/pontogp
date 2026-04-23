import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anunciantes | CerejaVIP - Sua Vitrine Digital',
  description: 'Crie seu perfil grátis na CerejaVIP. Galeria HD, stories, link na bio, dashboard e mais. Junte-se a milhares de profissionais.',
}

export default function AnunciantesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
