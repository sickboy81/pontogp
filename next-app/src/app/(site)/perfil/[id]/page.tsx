import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/api/profiles'
import { getProfileOgImageUrl } from '@/lib/og'
import { getProfileMetadataDescription } from '@/lib/profile-url'
import { SEO_CITIES } from '@/lib/seo-cities'
import { findSeoStateByUf } from '@/lib/seo-states'
import ProfileView from '@/components/ProfileView'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

type Props = { params: Promise<{ id: string }>; searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const profile = await getProfile(id)
  if (!profile) return { title: 'Perfil não encontrado' }
  const title = `${profile.name} - ${profile.city}, ${profile.state}`
  const description = getProfileMetadataDescription(profile)
  const ogImageUrl = getProfileOgImageUrl(profile)
  const canonical = `${SITE_URL}/perfil/${encodeURIComponent(id)}`
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

export default async function PerfilByIdPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = searchParams != null ? await searchParams : null
  const storyParam = sp?.story
  const initialStoryId =
    typeof storyParam === 'string'
      ? storyParam
      : Array.isArray(storyParam)
        ? storyParam[0]
        : undefined
  const openStories = sp?.stories === '1' || Boolean(initialStoryId)
  const profile = await getProfile(id)
  if (!profile) notFound()
  // The ID route is the stable fallback for every public profile. Do not
  // redirect it to a user-provided slug: a malformed, stale, or unsupported
  // slug must never turn a profile that is visible in listings into a 404.
  const legacyPath = `/perfil/${encodeURIComponent(id)}`

  const profileUrl = `${SITE_URL}${legacyPath}`
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
      <ProfileView
        profile={profile}
        profileUrl={profileUrl}
        openStories={openStories}
        initialStoryId={initialStoryId}
      />
    </>
  )
}
