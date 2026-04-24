import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/api/profiles'
import { getProfileOgImageUrl } from '@/lib/og'
import ProfileView from '@/components/ProfileView'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

type Props = { params: Promise<{ id: string }>; searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const profile = await getProfile(id)
  if (!profile) return { title: 'Perfil não encontrado' }
  const title = `${profile.name} - ${profile.city}, ${profile.state}`
  const description =
    profile.bio_title || profile.bio
      ? `${profile.bio_title || ''} ${profile.bio}`.trim().slice(0, 160) + '...'
      : `Perfil de ${profile.name} no CerejaVIP.`
  const ogImageUrl = getProfileOgImageUrl(profile)
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/perfil/${id}`,
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
  const profileUrl = `${SITE_URL}/perfil/${id}`
  return (
    <ProfileView
      profile={profile}
      profileUrl={profileUrl}
      openStories={openStories}
      initialStoryId={initialStoryId}
    />
  )
}
