'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'cerejavip_age_verified'

export default function AgeVerificationGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      setVerified(stored === '1')
    } catch {
      setVerified(false)
    }
  }, [])

  const handleConfirm = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {}
    setVerified(true)
  }

  const handleDecline = () => {
    router.push('/')
  }

  if (verified === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (verified) {
    return <>{children}</>
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900 p-8 text-center shadow-xl">
        <h2 className="text-xl font-bold text-white">Verificação de idade</h2>
        <p className="mt-4 text-slate-300">
          Este site é restrito a maiores de 18 anos. Você tem 18 anos ou mais?
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-primary-600 px-8 py-3 font-medium text-white hover:bg-primary-500"
          >
            Sim, tenho 18 ou mais
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="rounded-xl border border-slate-600 px-8 py-3 font-medium text-slate-300 hover:bg-slate-800"
          >
            Não
          </button>
        </div>
      </div>
    </div>
  )
}
