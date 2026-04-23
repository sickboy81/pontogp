export type SeoCity = {
  state: string
  city: string
  slug: string
}

export const SEO_CITIES: SeoCity[] = [
  { state: 'SP', city: 'São Paulo', slug: 'sao-paulo-sp' },
  { state: 'RJ', city: 'Rio de Janeiro', slug: 'rio-de-janeiro-rj' },
  { state: 'MG', city: 'Belo Horizonte', slug: 'belo-horizonte-mg' },
  { state: 'PR', city: 'Curitiba', slug: 'curitiba-pr' },
  { state: 'RS', city: 'Porto Alegre', slug: 'porto-alegre-rs' },
  { state: 'SC', city: 'Florianópolis', slug: 'florianopolis-sc' },
  { state: 'BA', city: 'Salvador', slug: 'salvador-ba' },
  { state: 'PE', city: 'Recife', slug: 'recife-pe' },
  { state: 'DF', city: 'Brasília', slug: 'brasilia-df' },
  { state: 'GO', city: 'Goiânia', slug: 'goiania-go' },
  { state: 'CE', city: 'Fortaleza', slug: 'fortaleza-ce' },
  { state: 'AM', city: 'Manaus', slug: 'manaus-am' },
]

export function findSeoCityBySlug(slug: string): SeoCity | undefined {
  return SEO_CITIES.find((item) => item.slug === slug)
}
