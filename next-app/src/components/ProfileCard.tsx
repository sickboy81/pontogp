'use client'

import Link from 'next/link'
import { Heart, MapPin, CheckCircle, Star } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { formatPrice } from '@/utils/format'
import { useAuthStore } from '@/store/auth'
import { useFavoritesStore } from '@/store/favorites'

interface ProfileCardProps {
  profile: Profile
  index?: number
  planColor?: string
  priority?: boolean
}

export default function ProfileCard({ profile, index = 0, planColor, priority = false }: ProfileCardProps) {
  const user = useAuthStore((s) => s.user)
  const isFavorite = useFavoritesStore((s) => s.isFavorite(profile.id))
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite)
  const mainPhoto = profile.thumbnail || profile.photos?.[0]

  async function handleFavoriteClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    await toggleFavorite(profile.id)
  }

  let price = 0
  if (profile.prices && profile.prices.length > 0) {
    price = profile.prices[0].price
  } else if (profile.price_30min) {
    price = profile.price_30min
  } else if (profile.price_1h) {
    price = profile.price_1h
  } else if (profile.price_2h) {
    price = profile.price_2h
  } else if (profile.price_overnight) {
    price = profile.price_overnight
  }

  return (
    <div className="group relative">
      <Link
        href={`/perfil/${profile.id}`}
        className="block overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 transition hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-slate-800">
          {mainPhoto ? (
            <img
              src={mainPhoto}
              alt={profile.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
              <span className="text-4xl font-bold text-slate-400">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="absolute left-2 top-2 flex flex-col gap-2">
            {profile.is_online && (
              <span className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white shadow-lg">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                Online
              </span>
            )}
            {profile.featured && (
              <span
                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: planColor || '#dc2626' }}
              >
                <Star className="h-3 w-3 fill-white" />
                Destaque
              </span>
            )}
          </div>
          {user && (
            <button
              type="button"
              onClick={handleFavoriteClick}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-2 backdrop-blur-sm transition hover:bg-black/70"
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            >
              <Heart
                className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`}
              />
            </button>
          )}
        </div>
        <div className="p-4">
          <h3 className="mb-1 truncate font-semibold text-lg text-white">{profile.name}</h3>
          <div className="mb-2 flex items-center gap-1 text-[10px] text-slate-400">
            <span>{profile.age} anos</span>
            <span> • </span>
            <MapPin className="inline-block h-2 w-2" />
            <span> {profile.city}</span>
            {profile.code && (
              <>
                <span> • </span>
                <span className="font-mono">ID: {profile.code}</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] capitalize text-slate-300">
              {formatPrice(price)}
            </span>
            <span className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] capitalize text-slate-300">
              {profile.category}
            </span>
            <span className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] capitalize text-slate-300">
              {profile.gender}
            </span>
            {profile.verified && (
              <span className="flex items-center gap-0.5 rounded bg-blue-500/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                <CheckCircle className="h-2.5 w-2.5" />
                Verificado
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
