'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-white">Algo deu errado</h1>
      <p className="mt-2 text-slate-400">Ocorreu um erro inesperado nesta página.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-primary-500 px-4 py-2 font-medium text-white hover:bg-primary-600"
      >
        Tentar novamente
      </button>
    </div>
  )
}
