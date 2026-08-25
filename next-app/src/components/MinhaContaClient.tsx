'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, CreditCard, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'
import { getPb } from '@/lib/pb'

export default function MinhaContaClient() {
  const user = useAuthStore((state) => state.user)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user?.id) return
    if (newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('A confirmação não é igual à nova senha.')
      return
    }
    try {
      setSaving(true)
      await getPb().collection('users').update(user.id, {
        oldPassword: currentPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Senha alterada com sucesso.')
    } catch (error) {
      const detail = error as { response?: { data?: Record<string, { message?: string }> } }
      const message = Object.values(detail.response?.data || {}).find((item) => item?.message)?.message
      toast.error(message || 'Não foi possível alterar a senha. Confira a senha atual e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">Área pessoal</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">Minha conta</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Consulte os dados de acesso, mantenha sua senha segura e acompanhe seus pagamentos.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr,1.2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/70" aria-labelledby="dados-conta">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-primary-500/10 p-2.5 text-primary-600 dark:text-primary-400"><Mail className="h-5 w-5" /></span>
            <div>
              <h2 id="dados-conta" className="font-semibold text-slate-900 dark:text-white">Dados de acesso</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Seu email usado para entrar no CerejaVIP.</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email da conta</p>
            <p className="mt-1 break-all font-medium text-slate-900 dark:text-white">{user?.email || 'Email indisponível'}</p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <BadgeCheck className="h-4 w-4" />
            {user?.verified ? 'Email confirmado' : 'Email ainda não confirmado'}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/70" aria-labelledby="senha-conta">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-violet-500/10 p-2.5 text-violet-600 dark:text-violet-300"><KeyRound className="h-5 w-5" /></span>
            <div>
              <h2 id="senha-conta" className="font-semibold text-slate-900 dark:text-white">Alterar senha</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Use pelo menos 8 caracteres e não reutilize senhas expostas.</p>
            </div>
          </div>
          <form onSubmit={changePassword} className="mt-5 space-y-3">
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="Senha atual" autoComplete="current-password" required />
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="Nova senha (mínimo 8 caracteres)" autoComplete="new-password" minLength={8} required />
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="Confirme a nova senha" autoComplete="new-password" minLength={8} required />
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50">{saving ? 'Alterando senha...' : 'Alterar senha'}</button>
          </form>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-300"><CreditCard className="h-5 w-5" /></span>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Pagamentos e plano</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Veja cobranças PIX, pagamentos aprovados e tentativas pendentes.</p>
            </div>
          </div>
          <Link href="/pagamentos" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-primary-500 hover:text-primary-600 dark:border-slate-600 dark:text-slate-200 dark:hover:text-white">Ver histórico de pagamentos</Link>
        </div>
      </section>

      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />Nunca compartilhe sua senha, códigos de confirmação ou dados bancários com outras pessoas.</p>
    </div>
  )
}
