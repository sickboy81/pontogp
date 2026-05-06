import type { Profile } from '@/lib/types'

export type SeoIntent = {
  slug: string
  label: string
  plural: string
  titlePrefix: string
  searchPhrase: string
  category?: Profile['category']
  gender?: Profile['gender']
  description: string
  audienceLine: string
}

export const SEO_INTENTS: SeoIntent[] = [
  {
    slug: 'acompanhantes',
    label: 'Acompanhantes',
    plural: 'acompanhantes',
    titlePrefix: 'Acompanhantes',
    searchPhrase: 'acompanhantes',
    category: 'acompanhante',
    description: 'perfis de acompanhantes com fotos, descrição, disponibilidade e contato direto',
    audienceLine: 'ideal para quem busca presença, discrição e atendimento personalizado',
  },
  {
    slug: 'acompanhantes-femininas',
    label: 'Acompanhantes femininas',
    plural: 'acompanhantes femininas',
    titlePrefix: 'Acompanhantes femininas',
    searchPhrase: 'acompanhantes femininas',
    category: 'acompanhante',
    gender: 'mulher',
    description: 'perfis femininos com informações claras, filtros locais e navegação discreta',
    audienceLine: 'uma busca direta para comparar estilos, localização e disponibilidade',
  },
  {
    slug: 'acompanhantes-trans',
    label: 'Acompanhantes trans',
    plural: 'acompanhantes trans',
    titlePrefix: 'Acompanhantes trans',
    searchPhrase: 'acompanhantes trans',
    category: 'acompanhante',
    gender: 'trans',
    description: 'perfis trans com apresentação completa, privacidade e contato objetivo',
    audienceLine: 'voltada para quem procura diversidade, confiança e comunicação transparente',
  },
  {
    slug: 'massagistas',
    label: 'Massagistas',
    plural: 'massagistas',
    titlePrefix: 'Massagistas',
    searchPhrase: 'massagistas',
    category: 'massagista',
    description: 'perfis de massagistas com tipos de massagem, localização e disponibilidade',
    audienceLine: 'indicada para quem busca relaxamento, atendimento sensorial e agenda clara',
  },
  {
    slug: 'atendimento-online',
    label: 'Atendimento online',
    plural: 'atendimento online',
    titlePrefix: 'Atendimento online',
    searchPhrase: 'atendimento online adulto',
    category: 'online',
    description: 'perfis para videochamadas, sexting, conteúdos personalizados e contato remoto',
    audienceLine: 'uma opção para quem prefere privacidade, rapidez e interação à distância',
  },
]

export function findSeoIntentBySlug(slug: string): SeoIntent | undefined {
  return SEO_INTENTS.find((item) => item.slug === slug)
}

export function getIntentFilters(intent: SeoIntent): Record<string, string> {
  const filters: Record<string, string> = {}
  if (intent.category) filters.category = intent.category
  if (intent.gender) filters.gender = intent.gender
  return filters
}
