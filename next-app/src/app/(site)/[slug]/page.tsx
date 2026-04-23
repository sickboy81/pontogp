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
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${canonicalSlug}`,
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

  if (STATIC_SLUGS.has(slug)) notFound()

  const profile = await getProfileBySlug(slug)
  if (!profile) notFound()

  if (profile.display_mode === 'link_bio' && !rawSlug.startsWith('@')) {
    const suffix = viewFull ? '?view=full' : ''
    redirect(`/@${slug}${suffix}`)
  }

  const profileUrl = `${SITE_URL}/${rawSlug}`
  const content =
    profile.display_mode === 'link_bio' && !viewFull ? (
      <LinkBioView profile={profile} profileUrl={profileUrl} />
    ) : (
      <ProfileView profile={profile} profileUrl={profileUrl} />
    )
  return <AgeVerificationGate>{content}</AgeVerificationGate>
}
