type SeoCopy = {
  intro: string
  localLine?: string
  p1: string
  p2: string
  readMore: [string, string, string]
}

type LocationKind = 'city' | 'state'
type FaqItem = { question: string; answer: string }

const UF_STYLE: Record<string, { vibe: string; context: string }> = {
  RJ: {
    vibe: 'com energia vibrante, clima turístico e experiências envolventes',
    context: 'de passeios na orla e agenda social a momentos reservados com total discrição',
  },
  SP: {
    vibe: 'com perfil sofisticado, ritmo urbano e padrão executivo',
    context: 'de compromissos corporativos e jantares premium a encontros discretos em horários flexíveis',
  },
  MG: {
    vibe: 'com atendimento elegante, conversa envolvente e discrição',
    context: 'de ocasiões especiais e viagens de trabalho a momentos reservados com conforto',
  },
  PR: {
    vibe: 'com postura refinada, pontualidade e atendimento de alto nível',
    context: 'de compromissos sociais e eventos privados a agendas discretas durante a semana',
  },
  RS: {
    vibe: 'com elegância, presença marcante e comunicação direta',
    context: 'de encontros sociais e viagens a experiências reservadas com total privacidade',
  },
  SC: {
    vibe: 'com charme, sofisticação e atendimento personalizado',
    context: 'de roteiros em regiões litorâneas e turísticas a encontros discretos no dia a dia',
  },
  DF: {
    vibe: 'com discrição absoluta, postura premium e excelente apresentação',
    context: 'de agendas executivas e eventos institucionais a momentos reservados',
  },
  GO: {
    vibe: 'com presença forte, boa comunicação e estilo envolvente',
    context: 'de ocasiões sociais e viagens rápidas a encontros reservados com conforto',
  },
  BA: {
    vibe: 'com sintonia com o ritmo litorâneo, calor humano e discrição',
    context: 'de rotas urbanas, eventos e estadias a encontros reservados com praticidade',
  },
  PE: {
    vibe: 'com estilo acolhedor, boa presença e atendimento refinado',
    context: 'de compromissos na capital e bairros da orla a agendas flexíveis em dias de semana e fins de semana',
  },
  CE: {
    vibe: 'com energia de capital nordestina, atenção e presença',
    context: 'de alta temporada, turismo e trânsito local a encontros planejados com clareza',
  },
  AM: {
    vibe: 'com perfil de metrópole ribeirinha, logística e discrição',
    context: 'de deslocamento entre bairros e acessos a combinação com horários e disponibilidade',
  },
}

export function getLocationSeoCopy(
  uf: string,
  locationLabel: string,
  options?: { localSeoLine?: string }
): SeoCopy {
  const style = UF_STYLE[uf] ?? {
    vibe: 'com atendimento de alto padrão, discrição e presença marcante',
    context: 'de agendas sociais a momentos reservados com praticidade',
  }

  return {
    intro: `Se você busca acompanhantes em ${locationLabel} ${style.vibe}, esta é a página certa. Compare opções por estilo, disponibilidade e perfis verificados para encontrar resultados mais alinhados ao seu momento.`,
    ...(options?.localSeoLine ? { localLine: options.localSeoLine } : {}),
    p1: `As acompanhantes ${uf} desta seleção combinam charme, elegância e profissionalismo para experiências de alto padrão. Com filtros avançados, você encontra perfis ativos com mais rapidez e confiança.`,
    p2: `A busca por acompanhantes em ${locationLabel} fica mais objetiva quando você combina localização, categoria e perfil verificado. Isso melhora a qualidade dos contatos e reduz o tempo de escolha.`,
    readMore: [
      `Em ${locationLabel}, cada encontro pode atingir outro nível quando existe sintonia, presença e comunicação direta. Por isso, os anúncios priorizam informações completas, fotos recentes e disponibilidade atualizada.`,
      `Você encontra opções ${style.context}, com estilos variados para diferentes preferências. A proposta é tornar sua experiência mais fluida, direta e alinhada ao seu perfil.`,
      `Esta página de acompanhantes em ${locationLabel} é atualizada com frequência para destacar perfis ativos e facilitar comparação. Escolha com clareza, fale direto com a anunciante e alinhe os detalhes com praticidade.`,
    ],
  }
}

export function getLocationMetaDescription(
  uf: string,
  locationLabel: string,
  kind: LocationKind
): string {
  if (kind === 'city') {
    return `Acompanhantes em ${locationLabel}/${uf} com perfis verificados, filtros por categoria e disponibilidade. Compare opções e fale direto pela CerejaVIP.`
  }

  return `Acompanhantes em ${locationLabel} (${uf}). Explore cidades, perfis ativos e filtros por categoria para encontrar opções na CerejaVIP.`
}

export function getLocationMetaTitle(
  uf: string,
  locationLabel: string,
  kind: LocationKind
): string {
  const cityTemplates = [
    `Acompanhantes em ${locationLabel} - ${uf}`,
    `${locationLabel}/${uf}: acompanhantes de alto padrão`,
    `Acompanhantes ${locationLabel} (${uf}) - perfis verificados`,
  ]

  const stateTemplates = [
    `Acompanhantes em ${locationLabel} - ${uf}`,
    `${locationLabel} (${uf}): acompanhantes e perfis ativos`,
    `Acompanhantes ${locationLabel} - busca por cidades`,
  ]

  const templates = kind === 'city' ? cityTemplates : stateTemplates
  const seed = `${uf}:${locationLabel}:${kind}`
  const idx = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % templates.length
  return templates[idx]
}

export function getLocationHeroKicker(
  uf: string,
  locationLabel: string,
  kind: LocationKind
): string {
  const cityTemplates = [
    `Guia local de ${locationLabel}`,
    `Destaques em ${locationLabel}/${uf}`,
    `Busca premium em ${locationLabel}`,
  ]

  const stateTemplates = [
    `Guia estadual de ${locationLabel}`,
    `Destaques no estado ${uf}`,
    `Busca regional em ${locationLabel}`,
  ]

  const templates = kind === 'city' ? cityTemplates : stateTemplates
  const seed = `kicker:${uf}:${locationLabel}:${kind}`
  const idx = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % templates.length
  return templates[idx]
}

export function getLocationFaq(
  uf: string,
  locationLabel: string,
  kind: LocationKind
): FaqItem[] {
  const isCity = kind === 'city'
  const where = isCity ? `${locationLabel}/${uf}` : `${locationLabel} (${uf})`
  const placeWord = isCity ? 'cidade' : 'estado'
  const style = UF_STYLE[uf] ?? {
    vibe: 'com atendimento de alto padrão, discrição e presença marcante',
    context: 'de agendas sociais a momentos reservados com praticidade',
  }

  return [
    {
      question: `Como encontrar acompanhantes em ${where} com mais segurança?`,
      answer: `Use filtros por categoria, verificação e disponibilidade, compare perfis ativos e prefira anúncios com informações completas. Em ${where}, isso reduz tempo de busca e melhora a assertividade dos contatos.`,
    },
    {
      question: `Qual a vantagem de usar uma página local de ${placeWord}?`,
      answer: `A navegação local em ${where} facilita a comparação por região e estilo de atendimento. Você consegue refinar a busca com mais precisão e encontrar resultados alinhados ao seu perfil.`,
    },
    {
      question: `Os anúncios em ${where} são atualizados com frequência?`,
      answer: `Sim. A listagem prioriza perfis ativos e atualização constante para manter a busca relevante. O foco é oferecer opções ${style.context} com melhor experiência de navegação.`,
    },
  ]
}
