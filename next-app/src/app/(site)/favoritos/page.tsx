import { Suspense } from 'react'
import FavoritosClient from '@/components/FavoritosClient'

export const metadata = {
  title: 'Meus Favoritos',
  description: 'Seus perfis favoritos no CerejaVIP.',
}

export default function FavoritosPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 h-9 w-64 animate-pulse rounded bg-slate-700" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-xl bg-slate-700/50"
              />
            ))}
          </div>
        </div>
      }
    >
      <FavoritosClient />
    </Suspense>
  )
}
