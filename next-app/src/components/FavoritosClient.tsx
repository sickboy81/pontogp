'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useFavoritesStore } from '@/store/favorites'
import ProfileCard from '@/components/ProfileCard'

export default function FavoritosClient() {
  const { profiles, loading, loaded, fetchFavorites } = useFavoritesStore()

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  if (loading && !loaded) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-white">Meus Favoritos</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-xl bg-slate-700/50"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-white">Meus Favoritos</h1>
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/30 px-6 py-16 text-center">
          <Heart className="mb-4 h-16 w-16 text-slate-500" />
          <p className="mb-2 text-lg text-slate-300">Nenhum favorito ainda</p>
          <p className="mb-6 text-slate-400">
            Explore os perfis e clique no coração para adicionar aos favoritos.
          </p>
          <Link
            href="/"
            className="rounded-lg bg-primary-600 px-6 py-2.5 font-semibold text-white transition hover:bg-primary-500"
          >
            Explorar perfis
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  )
}
