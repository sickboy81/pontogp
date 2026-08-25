'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { getPb } from '@/lib/pb'

function ConfirmEmailChangeForm() {
  const token = useSearchParams().get('token')
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!token) return
    try {
      setLoading(true)
      await getPb().collection('users').confirmEmailChange(token, password)
      toast.success('Novo email confirmado. Entre novamente para continuar.')
      router.replace('/login')
    } catch {
      toast.error('Não foi possível confirmar o novo email. O link pode ter expirado.')
    } finally { setLoading(false) }
  }
  if (!token) return <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Link inválido. <Link className="text-primary-600 underline" href="/login">Ir para login</Link></div>
  return <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Confirmar novo email</h1>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Confirme sua senha atual para concluir a alteração de email.</p>
    <input className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha atual" required />
    <button disabled={loading} className="mt-3 w-full rounded-xl bg-primary-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{loading ? 'Confirmando...' : 'Confirmar novo email'}</button>
  </form>
}

export default function ConfirmarEmailPage() { return <Suspense fallback={<div>Carregando...</div>}><ConfirmEmailChangeForm /></Suspense> }
