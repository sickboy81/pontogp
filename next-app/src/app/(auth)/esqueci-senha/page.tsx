'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getPb } from '@/lib/pb'
import toast from 'react-hot-toast'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email?.trim()) {
      toast.error('Informe seu email')
      return
    }
    try {
      setLoading(true)
      await getPb().collection('users').requestPasswordReset(email.trim().toLowerCase())
      setSent(true)
      toast.success('Verifique seu email para redefinir a senha.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar email'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h1 className="text-xl font-bold text-white">Email enviado</h1>
        <p className="mt-2 text-slate-400">
          Enviamos um link para <strong className="text-white">{email}</strong>. Acesse seu email e clique no link para redefinir a senha.
        </p>
        <Link href="/login" className="mt-6 inline-block text-primary-500 hover:underline">
          Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h1 className="text-xl font-bold text-white">Recuperar senha</h1>
      <p className="mt-2 text-slate-400">Informe seu email para receber o link de redefinição.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="seu@email.com"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-500 py-3 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>
      <p className="mt-4 text-center">
        <Link href="/login" className="text-sm text-primary-400 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}
