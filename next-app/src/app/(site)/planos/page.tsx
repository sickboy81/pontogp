import PlanosClient from '@/components/PlanosClient'

export const metadata = {
  title: 'Planos e Preços - Anuncie como Acompanhante',
  description: 'Planos CerejaVIP a partir de grátis. Ganhe visibilidade com galeria HD, Cereja Stories, bump automático, link na bio e dashboard analytics. Sem fidelidade, pague via PIX.',
  alternates: { canonical: '/planos' },
}

export default function PlanosPage() {
  return <PlanosClient />
}
