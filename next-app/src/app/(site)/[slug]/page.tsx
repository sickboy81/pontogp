import { notFound, redirect } from 'next/navigation'
import { getProfileBySlug } from '@/lib/api/profiles'
import { getProfileOgImageUrl } from '@/lib/og'
import { STATIC_SLUGS } from '@/lib/constants'
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
  const description =
    profile.bio_title || profile.bio
      ? `${profile.bio_title || ''} ${profile.bio}`.trim().slice(0, 160) + '...'
      : `Perfil de ${profile.name} no CerejaVIP.`
  const ogImageUrl = getProfileOgImageUrl(profile)
  const canonicalSlug = profile.display_mode === 'link_bio' ? `@${slug}` : rawSlug
  const canonical = `${SITE_URL}/${canonicalSlug}`
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

  if (profile.display_mode === 'link_bio' && !rawSlug.startsWith('@') && !fromAtRewrite) {
    const suffix = viewFull ? '?view=full' : ''
    redirect(`/@${slug}${suffix}`)
  }

  const publicSlug = fromAtRewrite ? `@${slug}` : rawSlug
  const profileUrl = `${SITE_URL}/${publicSlug}`

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
        item: `${SITE_URL}/?state=${profile.state}&city=${encodeURIComponent(profile.city)}`,
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
