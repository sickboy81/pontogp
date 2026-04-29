export type SeoCity = {
  state: string
  city: string
  slug: string
  /** Uma frase totalmente local para evitar conteúdo idêntico entre landings. */
  localSeoLine: string
}

export const PRIORITY_CITY_SLUGS = [
  'sao-paulo-sp',
  'rio-de-janeiro-rj',
  'brasilia-df',
  'belo-horizonte-mg',
  'salvador-ba',
  'fortaleza-ce',
  'recife-pe',
  'curitiba-pr',
  'porto-alegre-rs',
  'florianopolis-sc',
  'goiania-go',
  'manaus-am',
  'belem-pa',
  'vitoria-es',
  'campo-grande-ms',
  'cuiaba-mt',
  'sao-luis-ma',
  'joao-pessoa-pb',
  'natal-rn',
  'teresina-pi',
]

export const SEO_CITIES: SeoCity[] = [
  {
    state: 'SP',
    city: 'São Paulo',
    slug: 'sao-paulo-sp',
    localSeoLine:
      'Em São Paulo, a demanda puxa encontros discretos na capital e eixos como Av. Paulista, Itaim, Jardins e região da Paulista, com trânsito e horários a combinar com antecedência.',
  },
  {
    state: 'SP',
    city: 'Campinas',
    slug: 'campinas-sp',
    localSeoLine:
      'Campinas concentra buscas em Cambuí, Taquaral, Guanabara e região central, além de alta circulação corporativa por causa do polo tecnológico e logístico.',
  },
  {
    state: 'SP',
    city: 'Santos',
    slug: 'santos-sp',
    localSeoLine:
      'Em Santos, bairros como Gonzaga, Boqueirão e Ponta da Praia aparecem com frequência; a dinâmica entre litoral e capital influencia horários e deslocamentos.',
  },
  {
    state: 'RJ',
    city: 'Rio de Janeiro',
    slug: 'rio-de-janeiro-rj',
    localSeoLine:
      'No Rio, orla e bairros como Copacabana, Ipanema, Barra e Centro concentram movimento intenso; buscas locais filtram bairro e região para aproximar oferta e deslocamento.',
  },
  {
    state: 'RJ',
    city: 'Niterói',
    slug: 'niteroi-rj',
    localSeoLine:
      'Niterói reúne demanda em Icaraí, Ingá e Jardim Icaraí, com fluxo constante para a capital; filtros de bairro e disponibilidade ajudam no match local.',
  },
  {
    state: 'MG',
    city: 'Belo Horizonte',
    slug: 'belo-horizonte-mg',
    localSeoLine:
      'Belo Horizonte combina Pampulha, Lourdes, Savassi e região central, com oferta sólida para quem busca atendimento em BH com critério e discrição.',
  },
  {
    state: 'MG',
    city: 'Uberlândia',
    slug: 'uberlandia-mg',
    localSeoLine:
      'Uberlândia tem procura forte em bairros centrais e zonas de comércio, com destaque para agendas alinhadas à rotina universitária e empresarial da cidade.',
  },
  {
    state: 'PR',
    city: 'Curitiba',
    slug: 'curitiba-pr',
    localSeoLine:
      'Em Curitiba, o clima e o trânsito entre Batel, Bigorrilho, Centro e arredores influenciam a logística: filtros de local ajudam a ajustar a busca com precisão.',
  },
  {
    state: 'PR',
    city: 'Londrina',
    slug: 'londrina-pr',
    localSeoLine:
      'Em Londrina, áreas como Gleba Palhano e região central concentram tráfego local; buscas com filtros refinados melhoram a precisão dos resultados.',
  },
  {
    state: 'RS',
    city: 'Porto Alegre',
    slug: 'porto-alegre-rs',
    localSeoLine:
      'Porto Alegre puxa demanda de Moinhos, Bela Vista, Cidade Baixa e entorno, com padrão de atendimento profissional e encontros em horários alinhados à agenda local.',
  },
  {
    state: 'RS',
    city: 'Caxias do Sul',
    slug: 'caxias-do-sul-rs',
    localSeoLine:
      'Caxias do Sul apresenta demanda consistente em áreas centrais e polos de serviço, com preferência por anúncios detalhados e disponibilidade atualizada.',
  },
  {
    state: 'SC',
    city: 'Florianópolis',
    slug: 'florianopolis-sc',
    localSeoLine:
      'Em Florianópolis, Lagoa, centro e cidades irmãs no entorno (continente) aparecem com frequência em buscas; use cidade e bairro para resultados coerentes com o percurso.',
  },
  {
    state: 'SC',
    city: 'Joinville',
    slug: 'joinville-sc',
    localSeoLine:
      'Joinville tem buscas concentradas em bairros tradicionais e eixos comerciais; a logística urbana favorece filtros por localização e horários definidos.',
  },
  {
    state: 'BA',
    city: 'Salvador',
    slug: 'salvador-ba',
    localSeoLine:
      'Salvador soma procura no circuito de Barra, Ondina, pituba e Cidade Baixa, além de deslocamento entre a orla e regiões centrais, típico da topografia soteropolitana.',
  },
  {
    state: 'BA',
    city: 'Feira de Santana',
    slug: 'feira-de-santana-ba',
    localSeoLine:
      'Feira de Santana funciona como hub regional, com tráfego de cidades vizinhas; perfis com localização clara e resposta rápida tendem a performar melhor.',
  },
  {
    state: 'PE',
    city: 'Recife',
    slug: 'recife-pe',
    localSeoLine:
      'No Recife, Boa Viagem, Pina e Zona Sul aparecem com frequência em anúncios, enquanto o trânsito entre ilhas e continente pesa no planejamento de encontros.',
  },
  {
    state: 'PE',
    city: 'Olinda',
    slug: 'olinda-pe',
    localSeoLine:
      'Olinda divide atenção entre áreas históricas e zonas de ligação com Recife, com boa resposta para buscas locais combinando cidade e bairro.',
  },
  {
    state: 'DF',
    city: 'Brasília',
    slug: 'brasilia-df',
    localSeoLine:
      'No DF, a malha de Asa Sul, Asa Norte, Lago Sul e eixos próximos ao Plano Piloto puxa a maior parte da busca, com padrão executivo e horários fora do pico de trânsito.',
  },
  {
    state: 'DF',
    city: 'Taguatinga',
    slug: 'taguatinga-df',
    localSeoLine:
      'Taguatinga concentra uma base grande de buscas do DF, com deslocamento intenso entre regiões administrativas e preferência por disponibilidade bem definida.',
  },
  {
    state: 'GO',
    city: 'Goiânia',
    slug: 'goiania-go',
    localSeoLine:
      'Goiânia consolida opções no Setor Oeste, Bueno, Jardim Goiás e entorno, com oferta crescente e demanda de quem vive no interior que passa por Goiânia com frequência.',
  },
  {
    state: 'GO',
    city: 'Aparecida de Goiânia',
    slug: 'aparecida-de-goiania-go',
    localSeoLine:
      'Aparecida de Goiânia cresce em volume de busca com forte integração à capital, exigindo filtros por região para otimizar deslocamento e conversão.',
  },
  {
    state: 'CE',
    city: 'Fortaleza',
    slug: 'fortaleza-ce',
    localSeoLine:
      'Em Fortaleza, Meireles, Aldeota e Iracema puxam tráfego de busca e turismo, com pico em alta temporada e bairros citados de forma clara em anúncios com boa resposta.',
  },
  {
    state: 'CE',
    city: 'Juazeiro do Norte',
    slug: 'juazeiro-do-norte-ce',
    localSeoLine:
      'Juazeiro do Norte tem procura regional relevante no Cariri, com picos em períodos de eventos e trânsito entre cidades próximas.',
  },
  {
    state: 'AM',
    city: 'Manaus',
    slug: 'manaus-am',
    localSeoLine:
      'Em Manaus, a dispersão por Chapada, Ponta Negra e região central, somada a ilhas e acessos, torna a localização e a disponibilidade fator chave no matching.',
  },
  {
    state: 'SP',
    city: 'Guarulhos',
    slug: 'guarulhos-sp',
    localSeoLine:
      'Guarulhos combina demanda local com fluxo do aeroporto internacional, e filtros por bairro ajudam a reduzir deslocamentos longos na cidade.',
  },
  {
    state: 'SP',
    city: 'São Bernardo do Campo',
    slug: 'sao-bernardo-do-campo-sp',
    localSeoLine:
      'Em São Bernardo do Campo, a procura se concentra em eixos centrais do ABC, com forte variação por horário e trânsito regional.',
  },
  {
    state: 'SP',
    city: 'Santo André',
    slug: 'santo-andre-sp',
    localSeoLine:
      'Santo André tem buscas frequentes em áreas comerciais e residenciais do ABC, onde clareza de localização melhora a taxa de contato.',
  },
  {
    state: 'SP',
    city: 'Osasco',
    slug: 'osasco-sp',
    localSeoLine:
      'Osasco apresenta movimento intenso por proximidade com a capital, e perfis com agenda objetiva tendem a converter melhor.',
  },
  {
    state: 'SP',
    city: 'Ribeirão Preto',
    slug: 'ribeirao-preto-sp',
    localSeoLine:
      'Ribeirão Preto reúne demanda de cidade-polo do interior paulista, com destaque para bairros centrais e regiões de alto fluxo noturno.',
  },
  {
    state: 'SP',
    city: 'Sorocaba',
    slug: 'sorocaba-sp',
    localSeoLine:
      'Em Sorocaba, o volume de buscas cresce em áreas urbanas próximas a centros comerciais, com preferência por anúncios detalhados.',
  },
  {
    state: 'SP',
    city: 'São José dos Campos',
    slug: 'sao-jose-dos-campos-sp',
    localSeoLine:
      'São José dos Campos concentra procura em regiões de perfil executivo e tecnológico, favorecendo filtros por disponibilidade.',
  },
  {
    state: 'SP',
    city: 'São José do Rio Preto',
    slug: 'sao-jose-do-rio-preto-sp',
    localSeoLine:
      'São José do Rio Preto tem tráfego regional relevante e boa resposta para buscas segmentadas por bairro e categoria.',
  },
  {
    state: 'SP',
    city: 'Mogi das Cruzes',
    slug: 'mogi-das-cruzes-sp',
    localSeoLine:
      'Em Mogi das Cruzes, a dinâmica entre centro e bairros residenciais influencia deslocamento, tornando filtros locais ainda mais úteis.',
  },
  {
    state: 'SP',
    city: 'Piracicaba',
    slug: 'piracicaba-sp',
    localSeoLine:
      'Piracicaba mantém demanda estável no interior, com destaque para perfis atualizados e comunicação direta para agilizar combinação.',
  },
  {
    state: 'RJ',
    city: 'Duque de Caxias',
    slug: 'duque-de-caxias-rj',
    localSeoLine:
      'Duque de Caxias registra procura constante pela ligação com a capital, e filtros por região ajudam a ajustar o deslocamento.',
  },
  {
    state: 'RJ',
    city: 'Nova Iguaçu',
    slug: 'nova-iguacu-rj',
    localSeoLine:
      'Nova Iguaçu concentra buscas na Baixada Fluminense com preferência por anúncios claros sobre disponibilidade e localização.',
  },
  {
    state: 'RJ',
    city: 'São Gonçalo',
    slug: 'sao-goncalo-rj',
    localSeoLine:
      'Em São Gonçalo, a demanda local se conecta a fluxos de Niterói e Rio, exigindo alinhamento de horário e região.',
  },
  {
    state: 'RJ',
    city: 'Campos dos Goytacazes',
    slug: 'campos-dos-goytacazes-rj',
    localSeoLine:
      'Campos dos Goytacazes tem comportamento de busca regional com foco em perfis ativos e respostas rápidas.',
  },
  {
    state: 'RJ',
    city: 'Petrópolis',
    slug: 'petropolis-rj',
    localSeoLine:
      'Petrópolis apresenta demanda ligada ao turismo e à serra, com variação de procura em fins de semana e feriados.',
  },
  {
    state: 'RJ',
    city: 'Volta Redonda',
    slug: 'volta-redonda-rj',
    localSeoLine:
      'Volta Redonda concentra buscas do eixo Sul Fluminense, onde filtros por cidade e categoria aumentam precisão.',
  },
  {
    state: 'MG',
    city: 'Contagem',
    slug: 'contagem-mg',
    localSeoLine:
      'Contagem acompanha a dinâmica metropolitana de BH, com destaque para buscas locais em regiões de maior densidade urbana.',
  },
  {
    state: 'MG',
    city: 'Juiz de Fora',
    slug: 'juiz-de-fora-mg',
    localSeoLine:
      'Juiz de Fora reúne demanda de polo universitário e comercial, favorecendo anúncios com informações completas.',
  },
  {
    state: 'MG',
    city: 'Betim',
    slug: 'betim-mg',
    localSeoLine:
      'Em Betim, o volume de procura acompanha os eixos industriais e residenciais, com importância de localização aproximada.',
  },
  {
    state: 'MG',
    city: 'Montes Claros',
    slug: 'montes-claros-mg',
    localSeoLine:
      'Montes Claros concentra buscas do norte mineiro e responde melhor a perfis com disponibilidade bem definida.',
  },
  {
    state: 'MG',
    city: 'Uberaba',
    slug: 'uberaba-mg',
    localSeoLine:
      'Uberaba tem tráfego local consistente e demanda regional, com bom desempenho para filtros por categoria e gênero.',
  },
  {
    state: 'MG',
    city: 'Governador Valadares',
    slug: 'governador-valadares-mg',
    localSeoLine:
      'Governador Valadares apresenta procura recorrente no leste mineiro, com preferência por anúncios objetivos e atualizados.',
  },
  {
    state: 'PR',
    city: 'Maringá',
    slug: 'maringa-pr',
    localSeoLine:
      'Maringá combina perfil urbano organizado e demanda estável, com filtros por bairro melhorando a assertividade.',
  },
  {
    state: 'PR',
    city: 'Ponta Grossa',
    slug: 'ponta-grossa-pr',
    localSeoLine:
      'Em Ponta Grossa, buscas locais crescem em áreas centrais e corredores logísticos, pedindo anúncios com dados claros.',
  },
  {
    state: 'PR',
    city: 'Cascavel',
    slug: 'cascavel-pr',
    localSeoLine:
      'Cascavel concentra demanda do oeste paranaense, com boa resposta para perfis completos e comunicação rápida.',
  },
  {
    state: 'PR',
    city: 'Foz do Iguaçu',
    slug: 'foz-do-iguacu-pr',
    localSeoLine:
      'Foz do Iguaçu tem sazonalidade ligada ao turismo e circulação trinacional, favorecendo filtros de horário e região.',
  },
  {
    state: 'PR',
    city: 'São José dos Pinhais',
    slug: 'sao-jose-dos-pinhais-pr',
    localSeoLine:
      'São José dos Pinhais acompanha o movimento da região metropolitana de Curitiba, com destaque para buscas de proximidade.',
  },
  {
    state: 'RS',
    city: 'Canoas',
    slug: 'canoas-rs',
    localSeoLine:
      'Canoas possui demanda integrada à Grande Porto Alegre, e filtros geográficos ajudam a reduzir deslocamentos.',
  },
  {
    state: 'RS',
    city: 'Pelotas',
    slug: 'pelotas-rs',
    localSeoLine:
      'Pelotas tem tráfego local relevante no sul gaúcho, com preferência por anúncios bem descritos e atualizados.',
  },
  {
    state: 'RS',
    city: 'Santa Maria',
    slug: 'santa-maria-rs',
    localSeoLine:
      'Em Santa Maria, o perfil universitário da cidade influencia horários de maior procura e conversão.',
  },
  {
    state: 'RS',
    city: 'Novo Hamburgo',
    slug: 'novo-hamburgo-rs',
    localSeoLine:
      'Novo Hamburgo concentra buscas no Vale dos Sinos, com bom desempenho para resultados filtrados por localização.',
  },
  {
    state: 'RS',
    city: 'Passo Fundo',
    slug: 'passo-fundo-rs',
    localSeoLine:
      'Passo Fundo reúne demanda regional do norte gaúcho, com destaque para anúncios com agenda objetiva.',
  },
  {
    state: 'SC',
    city: 'Blumenau',
    slug: 'blumenau-sc',
    localSeoLine:
      'Blumenau apresenta demanda local forte em períodos de eventos e turismo, com filtros por região melhorando o match.',
  },
  {
    state: 'SC',
    city: 'Itajaí',
    slug: 'itajai-sc',
    localSeoLine:
      'Itajaí combina atividade portuária e fluxo urbano intenso, favorecendo perfis com localização e disponibilidade claras.',
  },
  {
    state: 'SC',
    city: 'Balneário Camboriú',
    slug: 'balneario-camboriu-sc',
    localSeoLine:
      'Balneário Camboriú tem procura elevada em alta temporada, com buscas orientadas por proximidade e horários flexíveis.',
  },
  {
    state: 'SC',
    city: 'Chapecó',
    slug: 'chapeco-sc',
    localSeoLine:
      'Chapecó concentra demanda no oeste catarinense e responde bem a páginas locais com conteúdo específico.',
  },
  {
    state: 'SC',
    city: 'Criciúma',
    slug: 'criciuma-sc',
    localSeoLine:
      'Criciúma reúne tráfego regional do sul de Santa Catarina, com preferência por resultados com informações completas.',
  },
  {
    state: 'BA',
    city: 'Vitória da Conquista',
    slug: 'vitoria-da-conquista-ba',
    localSeoLine:
      'Vitória da Conquista atua como polo do sudoeste baiano, com procura regional concentrada em áreas urbanas centrais.',
  },
  {
    state: 'BA',
    city: 'Camaçari',
    slug: 'camacari-ba',
    localSeoLine:
      'Camaçari apresenta demanda ligada à região metropolitana de Salvador, com buscas filtradas por deslocamento.',
  },
  {
    state: 'BA',
    city: 'Ilhéus',
    slug: 'ilheus-ba',
    localSeoLine:
      'Ilhéus combina fluxo local e turístico no litoral sul baiano, com sazonalidade relevante em períodos de férias.',
  },
  {
    state: 'BA',
    city: 'Juazeiro',
    slug: 'juazeiro-ba',
    localSeoLine:
      'Juazeiro mantém demanda conectada ao eixo do São Francisco, favorecendo perfis com atualização frequente.',
  },
  {
    state: 'BA',
    city: 'Porto Seguro',
    slug: 'porto-seguro-ba',
    localSeoLine:
      'Porto Seguro possui comportamento sazonal forte por turismo, com picos de busca em finais de semana e feriados.',
  },
  {
    state: 'PE',
    city: 'Jaboatão dos Guararapes',
    slug: 'jaboatao-dos-guararapes-pe',
    localSeoLine:
      'Jaboatão dos Guararapes acompanha o volume da região metropolitana do Recife, com foco em proximidade geográfica.',
  },
  {
    state: 'PE',
    city: 'Caruaru',
    slug: 'caruaru-pe',
    localSeoLine:
      'Caruaru concentra demanda no agreste pernambucano e responde bem a páginas locais com copy regionalizada.',
  },
  {
    state: 'PE',
    city: 'Petrolina',
    slug: 'petrolina-pe',
    localSeoLine:
      'Petrolina tem procura relevante no sertão com integração ao polo vizinho, exigindo informações claras de região.',
  },
  {
    state: 'PE',
    city: 'Paulista',
    slug: 'paulista-pe',
    localSeoLine:
      'Paulista, na área metropolitana, registra buscas por conveniência de deslocamento e disponibilidade imediata.',
  },
  {
    state: 'DF',
    city: 'Ceilândia',
    slug: 'ceilandia-df',
    localSeoLine:
      'Ceilândia concentra grande volume de procura no DF, com preferência por anúncios de fácil contato e localização objetiva.',
  },
  {
    state: 'DF',
    city: 'Águas Claras',
    slug: 'aguas-claras-df',
    localSeoLine:
      'Águas Claras apresenta demanda urbana intensa e perfil de busca por praticidade, com filtros por região sendo decisivos.',
  },
  {
    state: 'GO',
    city: 'Anápolis',
    slug: 'anapolis-go',
    localSeoLine:
      'Anápolis reúne procura do eixo Goiânia-Brasília, com bom desempenho para perfis atualizados e segmentados.',
  },
  {
    state: 'CE',
    city: 'Caucaia',
    slug: 'caucaia-ce',
    localSeoLine:
      'Caucaia acompanha a dinâmica metropolitana de Fortaleza e tem buscas locais com foco em deslocamento curto.',
  },
  {
    state: 'PA',
    city: 'Belém',
    slug: 'belem-pa',
    localSeoLine:
      'Belém concentra grande parte da demanda do Pará, com buscas em bairros centrais e áreas de maior circulação urbana.',
  },
  {
    state: 'ES',
    city: 'Vitória',
    slug: 'vitoria-es',
    localSeoLine:
      'Vitória tem procura integrada à Grande Vitória, com destaque para filtros por localização e disponibilidade de horário.',
  },
  {
    state: 'MS',
    city: 'Campo Grande',
    slug: 'campo-grande-ms',
    localSeoLine:
      'Campo Grande reúne demanda regional com perfil urbano bem distribuído, favorecendo anúncios com detalhes claros.',
  },
  {
    state: 'MT',
    city: 'Cuiabá',
    slug: 'cuiaba-mt',
    localSeoLine:
      'Em Cuiabá, o clima e a logística urbana influenciam horários de atendimento, tornando filtros locais mais eficientes.',
  },
  {
    state: 'MA',
    city: 'São Luís',
    slug: 'sao-luis-ma',
    localSeoLine:
      'São Luís concentra o principal volume de busca do Maranhão, com preferência por páginas locais bem segmentadas.',
  },
  {
    state: 'PB',
    city: 'João Pessoa',
    slug: 'joao-pessoa-pb',
    localSeoLine:
      'João Pessoa apresenta demanda forte em áreas urbanas e litorâneas, com sazonalidade em finais de semana e feriados.',
  },
  {
    state: 'RN',
    city: 'Natal',
    slug: 'natal-rn',
    localSeoLine:
      'Natal combina procura local e turística, com melhor desempenho para perfis com disponibilidade atualizada.',
  },
  {
    state: 'PI',
    city: 'Teresina',
    slug: 'teresina-pi',
    localSeoLine:
      'Teresina concentra a maior parte da demanda do estado, com buscas locais favorecendo anúncios completos e objetivos.',
  },
  {
    state: 'AL',
    city: 'Maceió',
    slug: 'maceio-al',
    localSeoLine:
      'Maceió apresenta tráfego de busca relevante na capital e região litorânea, com forte resposta em períodos de alta temporada.',
  },
  {
    state: 'SE',
    city: 'Aracaju',
    slug: 'aracaju-se',
    localSeoLine:
      'Aracaju reúne demanda concentrada na capital e entorno, com boa conversão em resultados filtrados por proximidade.',
  },
  {
    state: 'RO',
    city: 'Porto Velho',
    slug: 'porto-velho-ro',
    localSeoLine:
      'Porto Velho concentra a busca regional de Rondônia, com preferência por perfis com localização e agenda bem definidas.',
  },
  {
    state: 'RR',
    city: 'Boa Vista',
    slug: 'boa-vista-rr',
    localSeoLine:
      'Boa Vista tem demanda local concentrada em áreas centrais, e anúncios atualizados melhoram a taxa de contato.',
  },
  {
    state: 'AC',
    city: 'Rio Branco',
    slug: 'rio-branco-ac',
    localSeoLine:
      'Rio Branco reúne o principal volume de busca do Acre, com destaque para filtros por cidade e categoria.',
  },
  {
    state: 'AP',
    city: 'Macapá',
    slug: 'macapa-ap',
    localSeoLine:
      'Macapá apresenta procura local estável e melhor desempenho para páginas de cidade com copy regionalizada.',
  },
  {
    state: 'TO',
    city: 'Palmas',
    slug: 'palmas-to',
    localSeoLine:
      'Palmas concentra buscas urbanas em expansão, com preferência por anúncios claros sobre disponibilidade e localização.',
  },
  {
    state: 'SP',
    city: 'Praia Grande',
    slug: 'praia-grande-sp',
    localSeoLine:
      'Praia Grande tem procura sazonal alta no litoral paulista e bom desempenho para filtros por região e disponibilidade.',
  },
  {
    state: 'SP',
    city: 'Jundiaí',
    slug: 'jundiai-sp',
    localSeoLine:
      'Jundiaí conecta fluxos entre capital e interior, com buscas locais concentradas em áreas urbanas de fácil acesso.',
  },
  {
    state: 'SP',
    city: 'Bauru',
    slug: 'bauru-sp',
    localSeoLine:
      'Em Bauru, a demanda regional do centro-oeste paulista favorece anúncios completos com localização aproximada.',
  },
  {
    state: 'SP',
    city: 'São Vicente',
    slug: 'sao-vicente-sp',
    localSeoLine:
      'São Vicente acompanha o movimento da Baixada Santista, com destaque para buscas por proximidade e horários flexíveis.',
  },
  {
    state: 'RJ',
    city: 'Macaé',
    slug: 'macae-rj',
    localSeoLine:
      'Macaé reúne demanda do setor de óleo e gás, com procura concentrada em áreas de hospedagem e regiões centrais.',
  },
  {
    state: 'RJ',
    city: 'Cabo Frio',
    slug: 'cabo-frio-rj',
    localSeoLine:
      'Cabo Frio apresenta sazonalidade forte por turismo e alta procura em períodos de férias e feriados prolongados.',
  },
  {
    state: 'RJ',
    city: 'Angra dos Reis',
    slug: 'angra-dos-reis-rj',
    localSeoLine:
      'Angra dos Reis combina demanda local e turística, com melhor conversão em anúncios com disponibilidade atualizada.',
  },
  {
    state: 'RJ',
    city: 'Itaboraí',
    slug: 'itaborai-rj',
    localSeoLine:
      'Itaboraí concentra buscas da região metropolitana leste, com relevância para filtros por bairro e deslocamento.',
  },
  {
    state: 'MG',
    city: 'Ipatinga',
    slug: 'ipatinga-mg',
    localSeoLine:
      'Ipatinga tem demanda consistente no Vale do Aço, com preferência por perfis com informações claras e resposta rápida.',
  },
  {
    state: 'MG',
    city: 'Poços de Caldas',
    slug: 'pocos-de-caldas-mg',
    localSeoLine:
      'Poços de Caldas registra tráfego de busca local e turístico, com picos em finais de semana e datas especiais.',
  },
  {
    state: 'MG',
    city: 'Divinópolis',
    slug: 'divinopolis-mg',
    localSeoLine:
      'Divinópolis concentra procura no centro-oeste mineiro, com bom desempenho para filtros por categoria e localização.',
  },
  {
    state: 'MG',
    city: 'Sete Lagoas',
    slug: 'sete-lagoas-mg',
    localSeoLine:
      'Sete Lagoas acompanha o eixo metropolitano de BH, com buscas locais favorecendo anúncios objetivos e atualizados.',
  },
  {
    state: 'PR',
    city: 'Colombo',
    slug: 'colombo-pr',
    localSeoLine:
      'Colombo integra o fluxo da grande Curitiba e responde melhor a perfis com localização aproximada e agenda clara.',
  },
  {
    state: 'PR',
    city: 'Guarapuava',
    slug: 'guarapuava-pr',
    localSeoLine:
      'Guarapuava apresenta demanda regional no centro-sul paranaense, com buscas filtradas por proximidade urbana.',
  },
  {
    state: 'PR',
    city: 'Paranaguá',
    slug: 'paranagua-pr',
    localSeoLine:
      'Paranaguá tem procura ligada ao eixo portuário e litoral, com sazonalidade em períodos de maior circulação.',
  },
  {
    state: 'RS',
    city: 'São Leopoldo',
    slug: 'sao-leopoldo-rs',
    localSeoLine:
      'São Leopoldo concentra parte da demanda do Vale dos Sinos, com destaque para filtros por bairro e disponibilidade.',
  },
  {
    state: 'RS',
    city: 'Rio Grande',
    slug: 'rio-grande-rs',
    localSeoLine:
      'Rio Grande apresenta buscas locais estáveis e fluxo regional, favorecendo anúncios com dados atualizados.',
  },
  {
    state: 'RS',
    city: 'Uruguaiana',
    slug: 'uruguaiana-rs',
    localSeoLine:
      'Uruguaiana possui demanda de fronteira e movimento sazonal, com melhor desempenho para páginas locais específicas.',
  },
  {
    state: 'SC',
    city: 'Lages',
    slug: 'lages-sc',
    localSeoLine:
      'Lages concentra buscas na serra catarinense, com preferência por resultados com localização clara e categoria definida.',
  },
  {
    state: 'SC',
    city: 'Jaraguá do Sul',
    slug: 'jaragua-do-sul-sc',
    localSeoLine:
      'Jaraguá do Sul reúne demanda urbana e industrial, com bom match em perfis com agenda e contato bem organizados.',
  },
  {
    state: 'BA',
    city: 'Lauro de Freitas',
    slug: 'lauro-de-freitas-ba',
    localSeoLine:
      'Lauro de Freitas acompanha o fluxo da região metropolitana de Salvador e favorece buscas por proximidade local.',
  },
  {
    state: 'BA',
    city: 'Itabuna',
    slug: 'itabuna-ba',
    localSeoLine:
      'Itabuna tem demanda regional no sul da Bahia, com destaque para perfis completos e localização aproximada.',
  },
  {
    state: 'PE',
    city: 'Garanhuns',
    slug: 'garanhuns-pe',
    localSeoLine:
      'Garanhuns registra procura regional no agreste, com comportamento de busca favorecendo páginas de cidade.',
  },
  {
    state: 'CE',
    city: 'Sobral',
    slug: 'sobral-ce',
    localSeoLine:
      'Sobral concentra demanda no norte cearense, com filtros por categoria e cidade melhorando a qualidade do contato.',
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

export function getPrioritySeoCities(): SeoCity[] {
  const order = new Map(PRIORITY_CITY_SLUGS.map((slug, idx) => [slug, idx]))
  return SEO_CITIES.filter((city) => order.has(city.slug)).sort(
    (a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999)
  )
}
