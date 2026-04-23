'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getPb } from '@/lib/pb'
import toast from 'react-hot-toast'

function VerificarEmailPendenteContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [loading, setLoading] = useState(false)

  const handleResend = async () => {
    if (!email) {
      toast.error('Email não informado')
      return
    }
    try {
      setLoading(true)
      await getPb().collection('users').requestVerification(email)
      toast.success('Email reenviado. Verifique sua caixa de entrada.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao reenviar'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h1 className="text-xl font-bold text-white">Confirme seu email</h1>
      <p className="mt-2 text-slate-400">
        Enviamos um link de verificação para <strong className="text-white">{email || 'seu email'}</strong>.
        Acesse sua caixa de entrada e clique no link para ativar sua conta.
      </p>
      <p className="mt-4 text-sm text-slate-400">
        Não recebeu? Verifique a pasta de spam ou clique abaixo para reenviar.
      </p>
      <button
        type="button"
        onClick={handleResend}
        disabled={loading}
        className="mt-4 w-full rounded-lg border border-slate-600 py-3 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Reenviar email'}
      </button>
      <p className="mt-6 text-center">
        <Link href="/login" className="text-primary-400 hover:underline">
          Ir para login
        </Link>
      </p>
    </div>
  )
}

export default function VerificarEmailPendentePage() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-slate-400">Carregando...</div>}>
      <VerificarEmailPendenteContent />
    </Suspense>
  )
}
