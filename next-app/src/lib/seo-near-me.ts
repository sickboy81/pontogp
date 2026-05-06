import { SEO_INTENTS, type SeoIntent } from '@/lib/seo-intents'

export type SeoNearMePage = {
  slug: string
  title: string
  heading: string
  label: string
  intentSlug: SeoIntent['slug']
  description: string
  audience: string
}

export const SEO_NEAR_ME_PAGES: SeoNearMePage[] = [
  {
    slug: 'acompanhantes-perto-de-mim',
    title: 'Acompanhantes perto de mim - busca por cidade na CerejaVIP',
    heading: 'Acompanhantes perto de mim',
    label: 'Acompanhantes perto de mim',
    intentSlug: 'acompanhantes',
    description:
      'Encontre páginas locais de acompanhantes por cidade e estado, com navegação discreta, filtros regionais e links diretos para perfis ou cadastro.',
    audience:
      'Use esta página como ponto de partida para escolher sua cidade, comparar regiões e chegar em buscas locais mais relevantes.',
  },
  {
    slug: 'massagistas-perto-de-mim',
    title: 'Massagistas perto de mim - busca local na CerejaVIP',
    heading: 'Massagistas perto de mim',
    label: 'Massagistas perto de mim',
    intentSlug: 'massagistas',
    description:
      'Busque massagistas por cidade, estado e páginas locais com foco em localização, disponibilidade e contato direto.',
    audience:
      'A navegação por região ajuda quem procura atendimento sensorial, massagem relaxante ou opções adultas com discrição.',
  },
  {
    slug: 'acompanhantes-trans-perto-de-mim',
    title: 'Acompanhantes trans perto de mim - busca local na CerejaVIP',
    heading: 'Acompanhantes trans perto de mim',
    label: 'Acompanhantes trans perto de mim',
    intentSlug: 'acompanhantes-trans',
    description:
      'Explore páginas locais de acompanhantes trans por cidade e estado, com conteúdo regional e caminhos claros para descobrir perfis.',
    audience:
      'Ideal para quem quer encontrar opções próximas com privacidade, diversidade e filtros de localização.',
  },
]

export function findSeoNearMePage(slug: string): SeoNearMePage | undefined {
  return SEO_NEAR_ME_PAGES.find((item) => item.slug === slug)
}

export function getSeoNearMeIntent(page: SeoNearMePage): SeoIntent {
  return SEO_INTENTS.find((item) => item.slug === page.intentSlug) ?? SEO_INTENTS[0]
}
