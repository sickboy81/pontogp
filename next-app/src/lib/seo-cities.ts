export type SeoCity = {
  state: string
  city: string
  slug: string
  /** Uma frase totalmente local para evitar conteúdo idêntico entre landings. */
  localSeoLine: string
}

export const SEO_CITIES: SeoCity[] = [
  {
    state: 'SP',
    city: 'São Paulo',
    slug: 'sao-paulo-sp',
    localSeoLine:
      'Em São Paulo, a demanda puxa encontros discretos na capital e eixos como Av. Paulista, Itaim, Jardins e região da Paulista, com trânsito e horários a combinar com antecedência.',
  },
  {
    state: 'RJ',
    city: 'Rio de Janeiro',
    slug: 'rio-de-janeiro-rj',
    localSeoLine:
      'No Rio, orla e bairros como Copacabana, Ipanema, Barra e Centro concentram movimento intenso; buscas locais filtram bairro e região para aproximar oferta e deslocamento.',
  },
  {
    state: 'MG',
    city: 'Belo Horizonte',
    slug: 'belo-horizonte-mg',
    localSeoLine:
      'Belo Horizonte combina Pampulha, Lourdes, Savassi e região central, com oferta sólida para quem busca atendimento em BH com critério e discrição.',
  },
  {
    state: 'PR',
    city: 'Curitiba',
    slug: 'curitiba-pr',
    localSeoLine:
      'Em Curitiba, o clima e o trânsito entre Batel, Bigorrilho, Centro e arredores influenciam a logística: filtros de local ajudam a ajustar a busca com precisão.',
  },
  {
    state: 'RS',
    city: 'Porto Alegre',
    slug: 'porto-alegre-rs',
    localSeoLine:
      'Porto Alegre puxa demanda de Moinhos, Bela Vista, Cidade Baixa e entorno, com padrão de atendimento profissional e encontros em horários alinhados à agenda local.',
  },
  {
    state: 'SC',
    city: 'Florianópolis',
    slug: 'florianopolis-sc',
    localSeoLine:
      'Em Florianópolis, Lagoa, centro e cidades irmãs no entorno (continente) aparecem com frequência em buscas; use cidade e bairro para resultados coerentes com o percurso.',
  },
  {
    state: 'BA',
    city: 'Salvador',
    slug: 'salvador-ba',
    localSeoLine:
      'Salvador soma procura no circuito de Barra, Ondina, pituba e Cidade Baixa, além de deslocamento entre a orla e regiões centrais, típico da topografia soteropolitana.',
  },
  {
    state: 'PE',
    city: 'Recife',
    slug: 'recife-pe',
    localSeoLine:
      'No Recife, Boa Viagem, Pina e Zona Sul aparecem com frequência em anúncios, enquanto o trânsito entre ilhas e continente pesa no planejamento de encontros.',
  },
  {
    state: 'DF',
    city: 'Brasília',
    slug: 'brasilia-df',
    localSeoLine:
      'No DF, a malha de Asa Sul, Asa Norte, Lago Sul e eixos próximos ao Plano Piloto puxa a maior parte da busca, com padrão executivo e horários fora do pico de trânsito.',
  },
  {
    state: 'GO',
    city: 'Goiânia',
    slug: 'goiania-go',
    localSeoLine:
      'Goiânia consolida opções no Setor Oeste, Bueno, Jardim Goiás e entorno, com oferta crescente e demanda de quem vive no interior que passa por Goiânia com frequência.',
  },
  {
    state: 'CE',
    city: 'Fortaleza',
    slug: 'fortaleza-ce',
    localSeoLine:
      'Em Fortaleza, Meireles, Aldeota e Iracema puxam tráfego de busca e turismo, com pico em alta temporada e bairros citados de forma clara em anúncios com boa resposta.',
  },
  {
    state: 'AM',
    city: 'Manaus',
    slug: 'manaus-am',
    localSeoLine:
      'Em Manaus, a dispersão por Chapada, Ponta Negra e região central, somada a ilhas e acessos, torna a localização e a disponibilidade fator chave no matching.',
  },
]

export function findSeoCityBySlug(slug: string): SeoCity | undefined {
  return SEO_CITIES.find((item) => item.slug === slug)
}

export function getCitiesInState(uf: string, excludeSlug?: string): SeoCity[] {
  return SEO_CITIES.filter(
    (c) => c.state === uf && (excludeSlug == null || c.slug !== excludeSlug)
  )
}
