import { notFound, permanentRedirect } from 'next/navigation'
import { getProfileBySlug } from '@/lib/api/profiles'
import { getProfileOgImageUrl } from '@/lib/og'
import { getProfileMetadataDescription, getPublicProfilePath, getPublicProfileUrl } from '@/lib/profile-url'
import { STATIC_SLUGS } from '@/lib/constants'
import { SEO_CITIES } from '@/lib/seo-cities'
import { findSeoStateByUf } from '@/lib/seo-states'
import ProfileView from '@/components/ProfileView'
import LinkBioView from '@/components/LinkBioView'
import AgeVerificationGate from '@/components/AgeVerificationGate'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

type Props = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props) {
  const { slug: rawSlug } = await params
  const slug = rawSlug.startsWith('@') ? rawSlug.slice(1) : rawSlug
  if (STATIC_SLUGS.has(slug)) return {}
  const profile = await getProfileBySlug(slug)
  if (!profile) return { title: 'Perfil não encontrado' }
  const title = `${profile.name} - ${profile.city}, ${profile.state}`
  const description = getProfileMetadataDescription(profile)
  const ogImageUrl = getProfileOgImageUrl(profile)
  const canonical = getPublicProfileUrl(profile, SITE_URL)
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'profile',
      images: [
        {
          url: ogImageUrl,
          alt: `${profile.name} - CerejaVIP`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ProfileBySlugPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params
  const slug = rawSlug.startsWith('@') ? rawSlug.slice(1) : rawSlug
  const resolved = await searchParams
  const viewFull = resolved?.view === 'full'
  const fromAtRewrite = resolved?.__at === '1'

  if (STATIC_SLUGS.has(slug)) notFound()

  const profile = await getProfileBySlug(slug)
  if (!profile) notFound()

  const currentPath = fromAtRewrite ? `/@${slug}` : `/${rawSlug}`
  const canonicalPath = getPublicProfilePath(profile)
  if (currentPath !== canonicalPath) {
    const suffix = viewFull ? '?view=full' : ''
    permanentRedirect(`${canonicalPath}${suffix}`)
  }

  const profileUrl = getPublicProfileUrl(profile, SITE_URL)
  const cityLanding = SEO_CITIES.find(
    (item) => item.state === profile.state && item.city.trim().toLowerCase() === profile.city.trim().toLowerCase()
  )
  const stateLanding = findSeoStateByUf(profile.state)
  const locationUrl = cityLanding
    ? `${SITE_URL}/cidade/${cityLanding.slug}`
    : stateLanding
      ? `${SITE_URL}/estado/${stateLanding.slug}`
      : `${SITE_URL}/`

  const profilePageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: profileUrl,
    inLanguage: 'pt-BR',
    mainEntity: {
      '@type': 'Person',
      name: profile.name,
      description: profile.bio_title || profile.bio || `Perfil de ${profile.name} no CerejaVIP`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: profile.city,
        addressRegion: profile.state,
        addressCountry: 'BR',
      },
    },
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_URL}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: `Acompanhantes em ${profile.city}`,
        item: locationUrl,
      },
      { '@type': 'ListItem', position: 3, name: profile.name, item: profileUrl },
    ],
  }

  const content =
    profile.display_mode === 'link_bio' && !viewFull ? (
      <LinkBioView profile={profile} profileUrl={profileUrl} />
    ) : (
      <ProfileView profile={profile} profileUrl={profileUrl} />
    )
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <AgeVerificationGate>{content}</AgeVerificationGate>
    </>
  )
}
