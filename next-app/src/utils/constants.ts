export const CITIES_BY_STATE: Record<string, string[]> = {
  SP: ['São Paulo', 'Campinas', 'Guarulhos', 'Santos', 'Ribeirão Preto', 'Sorocaba'],
  RJ: ['Rio de Janeiro', 'Niterói', 'São Gonçalo', 'Cabo Frio', 'Macaé'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora'],
  DF: ['Brasília'],
  BA: ['Salvador', 'Feira de Santana', 'Camaçari'],
  PR: ['Curitiba', 'Londrina', 'Maringá', 'Foz do Iguaçu'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Canoas'],
  GO: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau'],
  PE: ['Recife', 'Olinda', 'Caruaru'],
  CE: ['Fortaleza', 'Caucaia'],
  ES: ['Vitória', 'Vila Velha', 'Serra'],
  MS: ['Campo Grande', 'Dourados'],
  PA: ['Belém', 'Ananindeua'],
  AM: ['Manaus'],
}

export const CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador',
  'Curitiba', 'Fortaleza', 'Recife', 'Porto Alegre', 'Goiânia',
]

export function getCitiesByState(state?: string): string[] {
  if (!state) return CITIES
  return CITIES_BY_STATE[state] || []
}

export const NEIGHBORHOODS_BY_CITY: Record<string, string[]> = {
  'São Paulo': [
    'Centro', 'Vila Madalena', 'Pinheiros', 'Jardins', 'Itaim Bibi', 'Vila Olímpia',
    'Moema', 'Brooklin', 'Campo Belo', 'Santo Amaro', 'Vila Mariana', 'Paraíso',
    'Bela Vista', 'Consolação', 'Jardim Paulista', 'Alto de Pinheiros', 'Lapa',
    'Perdizes', 'Pompeia', 'Vila Leopoldina', 'Barra Funda', 'Bom Retiro',
    'Liberdade', 'Aclimação', 'Cambuci', 'Tatuapé', 'Mooca', 'Brás', 'Belém',
    'Água Rasa', 'Carrão', 'Penha', 'Ipiranga', 'Sé', 'República', 'Santa Cecília',
    'Higienópolis', 'Pacaembu', 'Sumaré', 'Butantã',
  ],
  'Rio de Janeiro': [
    'Copacabana', 'Ipanema', 'Leblon', 'Barra da Tijuca', 'Botafogo', 'Flamengo',
    'Lagoa', 'Tijuca', 'Jardim Botânico', 'Urca', 'Laranjeiras', 'Catete', 'Glória',
    'Centro', 'Santa Teresa', 'São Conrado', 'Recreio dos Bandeirantes', 'Méier',
    'Guaratiba', 'Campo Grande', 'Santa Cruz', 'Sepetiba', 'Madureira', 'Bangu',
    'Vila Valqueire', 'Piedade', 'Abolição', 'Quintino', 'Pilares', 'Vila Isabel',
    'Rio Comprido', 'Maracanã', 'Andaraí', 'Grajaú', 'Jacarepaguá', 'Taquara',
    'Rocinha', 'Vidigal', 'Gávea', 'Leme', 'Cosme Velho', 'Paquetá',
  ],
  'Belo Horizonte': [
    'Centro', 'Savassi', 'Funcionários', 'Lourdes', 'Santo Antônio', 'Boa Viagem',
    'Santa Efigênia', 'Floresta', 'Prado', 'Cidade Nova', 'Barro Preto', 'São Pedro',
    'Belvedere', 'Gutierrez', 'Sion', 'Serra', 'Mangabeiras', 'Alto Barroca',
    'Santa Tereza', 'Sagrada Família', 'Carlos Prates', 'Coração Eucarístico',
    'União', 'Nova Suíça', 'Cidade Jardim', 'Estoril', 'Luxemburgo', 'Anchieta',
    'Buritis', 'Castelo', 'Ouro Preto', 'Caiçara',
  ],
  'Brasília': [
    'Asa Norte', 'Asa Sul', 'Sudoeste', 'Noroeste', 'Lago Sul', 'Lago Norte',
    'Águas Claras', 'Taguatinga', 'Gama', 'Guará', 'Ceilândia', 'Plano Piloto',
    'Sobradinho', 'Cruzeiro', 'Octogonal', 'Samambaia', 'São Sebastião', 'Paranoá',
    'Brazlândia', 'Planaltina', 'Santa Maria', 'Riacho Fundo', 'Vicente Pires',
  ],
  'Salvador': [
    'Barra', 'Ondina', 'Rio Vermelho', 'Pituba', 'Caminho das Árvores', 'Imbuí',
    'Stiep', 'Graça', 'Garcia', 'Federação', 'Centro', 'Pelourinho', 'Comércio',
    'Campo Grande', 'Vitória', 'Itapuã', 'Piatã', 'Boca do Rio', 'Armação',
    'Costa Azul', 'Patamares', 'Paralela', 'Iguatemi', 'Bonfim', 'Nazaré',
  ],
  'Curitiba': [
    'Centro', 'Batel', 'Água Verde', 'Bigorrilho', 'Bom Retiro', 'Juvevê', 'Mercês',
    'Jardim Botânico', 'Bacacheri', 'Boa Vista', 'Cristo Rei', 'São Francisco',
    'Rebouças', 'Parolin', 'Cabral', 'Centro Cívico', 'Campo Comprido',
    'Vila Izabel', 'Santa Felicidade', 'Pilarzinho', 'Ahú', 'São Lourenço',
  ],
  'Fortaleza': [
    'Meireles', 'Aldeota', 'Praia de Iracema', 'Dionísio Torres', 'Montese',
    'Parquelândia', 'Papicu', 'Sabiaguaba', 'Varjota', 'Centro', 'Benfica',
    'Rodolfo Teófilo', 'Fátima', 'Parangaba', 'Mucuripe', 'Cocó', 'Cidade 2000',
    'Engenheiro Luciano Cavalcante', 'Pici', 'Mondubim', 'Praia do Futuro',
    'Edson Queiroz', 'Joaquim Távora',
  ],
  'Recife': [
    'Boa Viagem', 'Pina', 'Parnamirim', 'Espinheiro', 'Graças', 'Casa Forte',
    "Ponte d'Uchoa", 'Derby', 'Torre', 'Ilha do Leite', 'Santo Antônio', 'São José',
    'Centro', 'Boa Vista', 'Campo Grande', 'Casa Amarela', 'Apipucos', 'Monteiro',
    'Poço da Panela', 'Rosarinho', 'Cordeiro', 'Madalena', 'Jaqueira', 'Setúbal',
  ],
  'Porto Alegre': [
    'Moinhos de Vento', 'Bela Vista', 'Bom Fim', 'Centro', 'Cidade Baixa',
    'Floresta', 'Menino Deus', 'Petrópolis', 'Tristeza', 'Vila Conceição',
    'Auxiliadora', 'Santa Cecília', 'Rio Branco', 'Independência', 'Santana',
    'Partenon', 'Cristal', 'Mont Serrat',
  ],
  'Goiânia': [
    'Centro', 'Mara Rosa', 'Setor Bueno', 'Setor Oeste', 'Setor Sul', 'Marista',
    'Jardim América', 'Campinas', 'Vila Nova', 'Setor Universitário',
    'Parque Amazônia', 'Alto da Glória', 'Setor Jaó', 'Jardim Goiás',
    'Setor Aeroporto', 'Setor Central', 'Setor Pedro Ludovico',
  ],
  'Manaus': [
    'Centro', 'Adrianópolis', 'Aleixo', 'Cachoeirinha', 'Coroado', 'Educandos',
    'Flores', 'Japiim', 'Nossa Senhora das Graças', 'Parque 10 de Novembro',
    'São Raimundo', 'Tarumã', 'Ponta Negra', 'Cidade Nova', 'Compensa',
  ],
  'Belém': [
    'Centro', 'Batista Campos', 'Campina', 'Cidade Velha', 'Condor', 'Cremação',
    'Fátima', 'Guamá', 'Jurunas', 'Marco', 'Nazaré', 'Pedreira', 'Reduto',
    'São Brás', 'Umarizal', 'Val-de-Cans', 'Marambaia',
  ],
  'Vitória': [
    'Centro', 'Bento Ferreira', 'Enseada do Suá', 'Ilha do Boi', 'Jucutuquara',
    'Maruípe', 'Praia do Canto', 'Praia do Suá', 'Santa Lúcia', 'Santo Antônio',
    'Tabuazeiro', 'Vila Rubim',
  ],
  'Florianópolis': [
    'Centro', 'Agronômica', 'Barra da Lagoa', 'Campeche', 'Canasvieiras',
    'Coqueiros', 'Ingleses', 'Jurerê', 'Jurerê Internacional', 'Lagoa da Conceição',
    'Pantanal', 'Santo Antônio de Lisboa', 'Trindade', 'Itacorubi',
  ],
  'Natal': [
    'Centro', 'Alecrim', 'Areia Preta', 'Barro Vermelho', 'Candelária',
    'Capim Macio', 'Cidade Alta', 'Lagoa Nova', 'Neópolis', 'Petrópolis',
    'Ponta Negra', 'Praia do Meio', 'Tirol',
  ],
  'Campo Grande': [
    'Centro', 'Amambaí', 'Bandeirantes', 'Carandá Bosque', 'Guanandi',
    'Jardim América', 'Jardim dos Estados', 'Nova Lima', 'Santa Fé',
  ],
  'João Pessoa': [
    'Centro', 'Bessa', 'Cabo Branco', 'Castelo Branco', 'Cristo Redentor',
    'Jardim Oceania', 'Mangabeira', 'Miramar', 'Tambiá', 'Torre',
  ],
  'Maceió': [
    'Centro', 'Barro Duro', 'Cruz das Almas', 'Farol', 'Jatiúca', 'Jaraguá',
    'Mangabeiras', 'Pajuçara', 'Ponta Verde', 'Tabuleiro do Martins',
  ],
  'Aracaju': [
    'Centro', 'Atalaia', 'Coroa do Meio', 'Farolândia', 'Grageru', 'Jardins',
    'Luzia', 'Salgado Filho', 'Santo Antônio', 'São Conrado',
  ],
  'Teresina': [
    'Centro', 'Aeroporto', 'Cidade Nova', 'Dirceu Arcoverde', 'Fátima', 'Ininga',
    'Itararé', 'Mocambinho', 'Parque Piauí', 'São Cristóvão',
  ],
}

export function getNeighborhoodsByCity(city?: string): string[] {
  if (!city) return []
  return NEIGHBORHOODS_BY_CITY[city] || []
}

export const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export const CATEGORIES = [
  { value: 'acompanhante', label: 'Acompanhante' },
  { value: 'massagista', label: 'Massagista' },
  { value: 'online', label: 'Online' },
]

export const GENDERS = [
  { value: 'mulher', label: 'Mulher' },
  { value: 'homem', label: 'Homem' },
  { value: 'trans', label: 'Trans' },
  { value: 'casal', label: 'Casal' },
]

/** Opções de etnia (perfil e filtros). */
export const ETHNICITIES = ['Brancas', 'Latinas', 'Mulatas', 'Negras', 'Orientais']

export const HAIR_COLORS = ['Morenas', 'Loiras', 'Ruivas']

export const BODY_TYPES = ['BBW', 'Gordinha', 'Magra', 'Musculosa', 'Normal']

export const BREAST_TYPES = ['Peituda', 'Siliconada', 'Naturais', 'Pequenos']
export const PUBIS_TYPES = ['Depilado', 'Natural', 'Semi']

/** Serviços por categoria (form e perfil variam conforme category) */
export const SERVICES_BY_CATEGORY: Record<string, string[]> = {
  acompanhante: [
    'Beijo na boca', 'Sexo oral', 'Sexo anal', 'Sexo vaginal',
    'Massagem tântrica', 'Massagem relaxante', 'Dupla penetração',
    'Fantasias', 'Lingerie', 'Striptease',
    'Show privado', 'Encontro social', 'Pernoite', 'Viagem',
  ],
  massagista: [
    '4 Mãos', 'Cursos', 'Depilação', 'Fetiches', 'Lingam / Yoni', 'Mix',
    'Nuru', 'Para Casais', 'Prostática', 'Relaxante', 'Sensual', 'Tailandesa',
    'Tântrica', 'Terapêutica', 'Vivência / Interações', 'Outras',
  ],
  online: [
    'Videochamadas', 'Sexting', 'Ligação prévia', 'Mostram o rosto', 'Cara a cara',
  ],
}

/** Serviços especiais por categoria */
export const SPECIAL_SERVICES_BY_CATEGORY: Record<string, string[]> = {
  acompanhante: [
    'Garganta Profunda', 'Facefuck', 'Beijo Grego', 'Chuva Dourada', 'Chuva de Prata',
    'Chuva Negra', 'Chuva Romana', 'Inversão', 'Squirting', 'Strap on', 'BDSM',
    'Sado Duro', 'Sado Suave', 'Fetichismo',
  ],
  massagista: ['Masturbação', 'Sexo oral', 'Penetração'],
  online: [
    'Roupa íntima', 'Jogos de papéis', 'Fetiches', 'Squirting', 'Sexo anal',
    'Striptease', 'Disfarces', 'Avaliar seu pênis', 'Sexo oral', 'Chuva dourada',
    'Falar sujo', 'Jogos', 'Masturbação', 'Penetração', 'Dominação',
  ],
}

export function getServicesByCategory(category: string): string[] {
  return SERVICES_BY_CATEGORY[category] || SERVICES_BY_CATEGORY.acompanhante
}

export function getSpecialServicesByCategory(category: string): string[] {
  return SPECIAL_SERVICES_BY_CATEGORY[category] || SPECIAL_SERVICES_BY_CATEGORY.acompanhante
}

/** Compatibilidade: lista única para uso genérico (acompanhante) */
export const SERVICE_OPTIONS = SERVICES_BY_CATEGORY.acompanhante
/** Formas de pagamento aceitas */
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'PIX', label: 'PIX' },
  { value: 'Dinheiro', label: 'Dinheiro' },
  { value: 'Cartão de crédito', label: 'Cartão de crédito' },
  { value: 'Cartão de débito', label: 'Cartão de débito' },
]
/** Locais de atendimento */
export const SERVICE_LOCATION_OPTIONS = [
  'Tenho local', 'A domicílio', 'Hotel', 'Carro', 'Clube de swing', 'Casa de massagem', 'Despedida de solteiro', 'Outros',
]
/** Atende a (público) */
export const SERVICE_TO_OPTIONS = [
  { value: 'Homens', label: 'Homens' },
  { value: 'Mulheres', label: 'Mulheres' },
  { value: 'Casais', label: 'Casais' },
  { value: 'Deficientes físicos', label: 'Deficientes físicos' },
  { value: 'Lésbicas / Gays', label: 'Lésbicas / Gays' },
]
/** Serviços especiais (tags) – compatibilidade; use getSpecialServicesByCategory(category) no form */
export const SPECIAL_SERVICE_OPTIONS = SPECIAL_SERVICES_BY_CATEGORY.acompanhante

/** Massagista: outros serviços (Depilação, Estética, etc.) */
export const OTHER_SERVICES_MASSAGIST = ['Depilação', 'Estética', 'Reflexologia podal']

/** Online: itens à venda */
export const FOR_SALE_ONLINE = [
  'Áudios', 'Vídeos personalizados', 'Pacote de Fotos', 'Roupa íntima', 'Pacote de Vídeos',
]

/** Massagista: certificação (checkbox único) */
export const MASSAGE_CERTIFICATIONS = ['Massagista certificada']
export const SMOKER_OPTIONS = [
  { value: 'não', label: 'Não' },
  { value: 'sim', label: 'Sim' },
  { value: 'ocasionalmente', label: 'Ocasionalmente' },
]

const AGE_OPTIONS = [18, 20, 25, 30, 35, 40, 45, 50, 60]
export const AGE_OPTIONS_MIN = AGE_OPTIONS
export const AGE_OPTIONS_MAX = AGE_OPTIONS
