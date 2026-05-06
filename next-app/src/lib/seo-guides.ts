export type SeoGuide = {
  slug: string
  title: string
  description: string
  audience: 'visitantes' | 'anunciantes'
  sections: Array<{ heading: string; body: string }>
}

export const SEO_GUIDES: SeoGuide[] = [
  {
    slug: 'seguranca-ao-buscar-acompanhantes',
    title: 'Segurança ao buscar acompanhantes online',
    description:
      'Cuidados práticos para navegar por classificados adultos, comparar perfis, evitar golpes e manter discrição.',
    audience: 'visitantes',
    sections: [
      {
        heading: 'Compare perfis completos',
        body: 'Priorize anúncios com descrição clara, fotos consistentes, cidade informada, disponibilidade e canais de contato objetivos. Perfis incompletos dificultam a escolha e aumentam ruído na conversa.',
      },
      {
        heading: 'Use filtros locais',
        body: 'Buscar por cidade, estado e categoria reduz deslocamentos e torna a experiência mais direta. Páginas locais também ajudam a identificar opções relacionadas na mesma região.',
      },
      {
        heading: 'Preserve sua privacidade',
        body: 'Evite compartilhar dados desnecessários no primeiro contato. Combine detalhes com clareza, mantenha comunicação respeitosa e desconfie de pedidos fora do padrão.',
      },
    ],
  },
  {
    slug: 'como-criar-perfil-de-acompanhante',
    title: 'Como criar um perfil de acompanhante que converte',
    description:
      'Guia para anunciantes criarem perfis mais completos, confiáveis e preparados para receber visitantes da busca orgânica.',
    audience: 'anunciantes',
    sections: [
      {
        heading: 'Escreva uma apresentação objetiva',
        body: 'Explique seu estilo de atendimento, cidade, disponibilidade e diferenciais. Um texto direto ajuda visitantes a entenderem se o perfil combina com o que procuram.',
      },
      {
        heading: 'Mantenha informações atualizadas',
        body: 'Cidade, bairro aproximado, valores, horários e meios de contato precisam acompanhar sua rotina. Perfil atualizado gera mais confiança e reduz conversas improdutivas.',
      },
      {
        heading: 'Use categorias corretas',
        body: 'Escolher entre acompanhante, massagista ou atendimento online ajuda a aparecer nas páginas certas e melhora a qualidade do tráfego recebido.',
      },
    ],
  },
  {
    slug: 'fotos-para-classificados-adultos',
    title: 'Fotos para classificados adultos: qualidade e discrição',
    description:
      'Boas práticas para fotos de perfil em plataformas adultas, com foco em confiança, apresentação e privacidade.',
    audience: 'anunciantes',
    sections: [
      {
        heading: 'Prefira imagens recentes',
        body: 'Fotos atuais reduzem fricção e aumentam confiança. Evite imagens antigas, muito editadas ou que não representem seu perfil real.',
      },
      {
        heading: 'Cuide da composição',
        body: 'Iluminação, enquadramento e fundo organizado fazem diferença. Uma apresentação limpa melhora a percepção de profissionalismo sem depender de exageros.',
      },
      {
        heading: 'Proteja sua identidade quando necessário',
        body: 'Se quiser discrição, use cortes, ângulos e recursos de privacidade sem comprometer a clareza do anúncio. O importante é transmitir segurança e autenticidade.',
      },
    ],
  },
  {
    slug: 'divulgar-perfil-em-cidades',
    title: 'Como divulgar perfil em cidades com baixa concorrência',
    description:
      'Estratégia para anunciantes ganharem presença local em cidades onde ainda há poucos perfis publicados.',
    audience: 'anunciantes',
    sections: [
      {
        heading: 'Entre cedo nas páginas locais',
        body: 'Cidades com poucos anúncios podem oferecer mais espaço para quem cria um perfil completo primeiro. Isso ajuda a ocupar buscas locais antes da concorrência crescer.',
      },
      {
        heading: 'Use intenção de busca',
        body: 'Além da cidade, páginas por categoria como acompanhantes, massagistas, acompanhantes trans e atendimento online ajudam a conectar seu perfil com buscas mais específicas.',
      },
      {
        heading: 'Acompanhe cidades próximas',
        body: 'Se você atende mais de uma região, mantenha a descrição coerente e aproveite links para cidades do mesmo estado. A navegação regional aumenta descoberta.',
      },
    ],
  },
]

export function findSeoGuideBySlug(slug: string): SeoGuide | undefined {
  return SEO_GUIDES.find((item) => item.slug === slug)
}
