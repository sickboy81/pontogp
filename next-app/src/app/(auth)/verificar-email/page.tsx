'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getPb } from '@/lib/pb'
import toast from 'react-hot-toast'

function VerificarEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h1 className="text-xl font-bold text-white">Link inválido</h1>
        <p className="mt-2 text-slate-400">O link de verificação está incompleto.</p>
        <Link href="/login" className="mt-4 inline-block text-primary-500 hover:underline">
          Ir para login
        </Link>
      </div>
    )
  }

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await getPb().collection('users').confirmVerification(token)
      toast.success('Email verificado! Faça login.')
      router.replace('/login')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao verificar email'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h1 className="text-xl font-bold text-white">Verificar email</h1>
      <p className="mt-2 text-slate-400">Clique no botão abaixo para ativar sua conta.</p>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-primary-500 py-3 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
      >
        {loading ? 'Verificando...' : 'Confirmar email'}
      </button>
      <p className="mt-4 text-center">
        <Link href="/login" className="text-sm text-primary-400 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-slate-400">Carregando...</div>}>
      <VerificarEmailForm />
    </Suspense>
  )
}
