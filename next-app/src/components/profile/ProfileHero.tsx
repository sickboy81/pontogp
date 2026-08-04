'use client'

import Image from 'next/image'
import { Clock3, MapPin, Play } from 'lucide-react'
import type { Profile } from '@/lib/types'
import ProfileImageWithWatermark from '@/components/ProfileImageWithWatermark'

type ProfileHeroProps = {
  profile: Profile
  photos: string[]
  unavailable: boolean
  hasStories: boolean
  onOpenStory: () => void
  onOpenPhoto: (index: number) => void
}

export default function ProfileHero({
  profile,
  photos,
  unavailable,
  hasStories,
  onOpenStory,
  onOpenPhoto,
}: ProfileHeroProps) {
  const compactPrice =
    profile.price_1h ?? profile.price_30min ?? profile.price_2h ?? profile.price_overnight ?? null

  return (
    <div className="profile-reveal shrink-0 space-y-4 lg:w-[41%] xl:w-[39%]">
      <button
        type="button"
        onClick={() => {
          if (hasStories) onOpenStory()
        }}
        className={`profile-media-hover group relative block aspect-[3/4] w-full overflow-hidden rounded-[2rem] p-[3px] transition ${
          hasStories
            ? 'cursor-pointer bg-gradient-to-br from-primary-500 via-rose-500 to-orange-400 hover:brightness-110'
            : 'cursor-default bg-slate-700'
        }`}
        aria-label={hasStories ? 'Abrir stories ativas' : 'Sem stories ativas'}
      >
        <div className={`relative h-full w-full overflow-hidden rounded-[calc(2rem-3px)] bg-slate-700 ${profile.featured ? 'profile-featured-glow' : ''}`}>
          {profile.thumbnail ? (
            <ProfileImageWithWatermark
              src={profile.thumbnail}
              alt={profile.name}
              className="h-full w-full rounded-[calc(2rem-3px)]"
              imgClassName={`h-full w-full object-cover transition duration-500 ${unavailable ? 'scale-[1.03] blur-md grayscale' : 'group-hover:scale-[1.02]'}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">Sem foto</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              {profile.verified && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  Verificado
                </span>
              )}
              {profile.is_online && (
                <span className="rounded-full border border-green-400/30 bg-green-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-green-200">
                  Online agora
                </span>
              )}
              {unavailable && (
                <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                  Indisponível
                </span>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
              {profile.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary-300" />
                {profile.city}, {profile.state}
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                {profile.age} anos
              </span>
              {compactPrice != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1">
                  <Clock3 className="h-4 w-4 text-primary-300" />
                  A partir de R$ {compactPrice}
                </span>
              )}
            </div>
          </div>
        </div>
        {hasStories && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
            <Play className="h-3 w-3" />
            Story
          </span>
        )}
      </button>

      {photos.length > 1 && (
        <div className="profile-gallery-scroll flex gap-3 overflow-x-auto pb-2">
          {photos.slice(0, 8).map((src, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (!unavailable) onOpenPhoto(index)
              }}
              className="profile-media-hover h-20 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/40"
            >
              <ProfileImageWithWatermark
                src={src}
                alt=""
                className="h-full w-full rounded-2xl"
                imgClassName={`h-full w-full object-cover ${unavailable ? 'blur-md grayscale' : ''}`}
                showWatermark={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
