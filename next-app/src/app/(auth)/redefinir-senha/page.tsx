'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getPb } from '@/lib/pb'
import toast from 'react-hot-toast'

function RedefinirSenhaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h1 className="text-xl font-bold text-white">Link inválido</h1>
        <p className="mt-2 text-slate-400">O link de redefinição está incompleto ou expirado.</p>
        <Link href="/esqueci-senha" className="mt-4 inline-block text-primary-500 hover:underline">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres')
      return
    }
    if (password !== confirm) {
      toast.error('As senhas não coincidem')
      return
    }
    try {
      setLoading(true)
      await getPb().collection('users').confirmPasswordReset(token, password, password)
      toast.success('Senha alterada. Faça login.')
      router.replace('/login')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao redefinir senha'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h1 className="text-xl font-bold text-white">Nova senha</h1>
      <p className="mt-2 text-slate-400">Digite e confirme sua nova senha.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Nova senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            minLength={6}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Confirmar senha</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            minLength={6}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-500 py-3 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Redefinir senha'}
        </button>
      </form>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-slate-400">Carregando...</div>}>
      <RedefinirSenhaForm />
    </Suspense>
  )
}
