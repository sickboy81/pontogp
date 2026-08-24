'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Profile } from '@/lib/types'
import ProfileMap from '@/components/ProfileMap'

type ProfileSectionsProps = {
  profile: Profile
  photos: string[]
  unavailable: boolean
  onOpenPhoto: (index: number) => void
}

export default function ProfileSections({
  profile,
  photos,
  unavailable,
  onOpenPhoto,
}: ProfileSectionsProps) {
  return (
    <div className="profile-reveal space-y-6">
      {profile.category !== 'online' &&
        profile.location_lat != null &&
        profile.location_lng != null && (
          <section className="mx-auto w-full max-w-4xl rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
            <ProfileMap
              lat={profile.location_lat}
              lng={profile.location_lng}
              city={profile.city}
              state={profile.state}
              approximate={profile.location_approximate}
            />
          </section>
        )}

      {photos.length > 0 && (
        <section className="mx-auto w-full max-w-4xl rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Galeria</h3>
            <p className="text-xs text-slate-500">{photos.length} foto(s)</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((src, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (!unavailable) onOpenPhoto(index)
                }}
                className="profile-media-hover relative aspect-[3/4] overflow-hidden rounded-[1.35rem] border border-slate-700 bg-slate-700 transition hover:border-primary-500"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                  className={`object-cover ${unavailable ? 'blur-md grayscale' : ''}`}
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {profile.videos?.length > 0 && (
        <section className="mx-auto w-full max-w-4xl rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Vídeos</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {profile.videos.map((src, index) => (
              <div key={index} className="profile-media-hover overflow-hidden rounded-[1.35rem] border border-slate-700 bg-slate-800">
                <video src={src} controls className="w-full" preload="metadata" poster="" />
              </div>
            ))}
          </div>
        </section>
      )}

      {profile.audio && (
        <section className="mx-auto w-full max-w-4xl rounded-[1.75rem] border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Áudio de apresentação</h3>
          <div className="rounded-[1.35rem] border border-slate-700 bg-slate-800 p-4">
            <audio src={profile.audio} controls className="w-full" />
          </div>
        </section>
      )}

      <p className="mt-6">
        <Link href="/" className="text-primary-500 hover:underline">
          ← Voltar à listagem
        </Link>
      </p>
    </div>
  )
}
