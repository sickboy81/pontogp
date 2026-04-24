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
  'Tenho local', 'A domicílio', 'Hotel', 'Clube de swing', 'Casa de massagem', 'Despedida de solteiro', 'Outros',
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
