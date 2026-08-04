import type { Profile } from '@/lib/types'

type PublicProfileReference = Pick<Profile, 'id' | 'slug' | 'display_mode'>

export function getPublicProfilePath(profile: PublicProfileReference): string {
  const slug = profile.slug?.trim().replace(/^@+/, '')
  if (!slug) return `/perfil/${encodeURIComponent(profile.id)}`

  const prefix = profile.display_mode === 'link_bio' ? '@' : ''
  return `/${prefix}${encodeURIComponent(slug)}`
}

export function getPublicProfileUrl(profile: PublicProfileReference, siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, '')}${getPublicProfilePath(profile)}`
}

export function getProfileMetadataDescription(profile: Pick<Profile, 'name' | 'bio_title' | 'bio'>): string {
  const description =
    `${profile.bio_title || ''} ${profile.bio || ''}`.trim() ||
    `Perfil de ${profile.name} no CerejaVIP.`

  return description.length > 160
    ? `${description.slice(0, 157).trimEnd()}...`
    : description
}
