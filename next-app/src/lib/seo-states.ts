export type SeoState = {
  uf: string
  label: string
  slug: string
}

export const SEO_STATES: SeoState[] = [
  { uf: 'SP', label: 'São Paulo', slug: 'sao-paulo-sp' },
  { uf: 'RJ', label: 'Rio de Janeiro', slug: 'rio-de-janeiro-rj' },
  { uf: 'MG', label: 'Minas Gerais', slug: 'minas-gerais-mg' },
  { uf: 'PR', label: 'Paraná', slug: 'parana-pr' },
  { uf: 'RS', label: 'Rio Grande do Sul', slug: 'rio-grande-do-sul-rs' },
  { uf: 'SC', label: 'Santa Catarina', slug: 'santa-catarina-sc' },
  { uf: 'DF', label: 'Distrito Federal', slug: 'distrito-federal-df' },
  { uf: 'GO', label: 'Goiás', slug: 'goias-go' },
  { uf: 'BA', label: 'Bahia', slug: 'bahia-ba' },
  { uf: 'PE', label: 'Pernambuco', slug: 'pernambuco-pe' },
  { uf: 'CE', label: 'Ceará', slug: 'ceara-ce' },
  { uf: 'AM', label: 'Amazonas', slug: 'amazonas-am' },
]

export function findSeoStateBySlug(slug: string): SeoState | undefined {
  return SEO_STATES.find((item) => item.slug === slug)
}

export function findSeoStateByUf(uf: string): SeoState | undefined {
  const u = uf.trim().toUpperCase()
  return SEO_STATES.find((item) => item.uf === u)
}
