'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, BadgeCheck, CreditCard, KeyRound, Mail, ShieldCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'
import { getPb } from '@/lib/pb'

export default function MinhaContaClient() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

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

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault()
    if (deleteConfirmation !== 'EXCLUIR') {
      toast.error('Digite EXCLUIR para confirmar a exclusão.')
      return
    }
    try {
      setDeleting(true)
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: deletePassword, confirmation: deleteConfirmation }),
      })
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) throw new Error(data?.error || 'Não foi possível excluir a conta.')
      await logout()
      toast.success('Sua conta foi excluída.')
      router.replace('/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir a conta.')
    } finally {
      setDeleting(false)
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

      <section className="mt-5 rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-500/30 dark:bg-red-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-300" />
            <div>
              <h2 className="font-semibold text-red-900 dark:text-red-100">Excluir conta definitivamente</h2>
              <p className="mt-1 text-sm leading-6 text-red-800/80 dark:text-red-200/80">Apaga sua conta, perfil, mídias, conversas, favoritos, pagamentos e demais dados vinculados. Esta ação não pode ser desfeita.</p>
            </div>
          </div>
          <button type="button" onClick={() => setDeleteOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-500/50 dark:text-red-200 dark:hover:bg-red-500/15"><Trash2 className="h-4 w-4" />Excluir conta</button>
        </div>
      </section>

      {deleteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
          <form onSubmit={deleteAccount} className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-500/30 dark:bg-slate-900">
            <h2 id="delete-account-title" className="text-xl font-bold text-slate-900 dark:text-white">Confirmar exclusão da conta</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Esta ação é definitiva. Para continuar, informe sua senha atual e digite <strong>EXCLUIR</strong>.</p>
            <div className="mt-5 space-y-3">
              <input type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" placeholder="Senha atual" autoComplete="current-password" required />
              <input type="text" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value.toUpperCase())} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" placeholder="Digite EXCLUIR" required />
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => { setDeleteOpen(false); setDeletePassword(''); setDeleteConfirmation('') }} disabled={deleting} className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Cancelar</button>
              <button type="submit" disabled={deleting || deleteConfirmation !== 'EXCLUIR' || !deletePassword} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">{deleting ? 'Excluindo...' : 'Excluir definitivamente'}</button>
            </div>
          </form>
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />Nunca compartilhe sua senha, códigos de confirmação ou dados bancários com outras pessoas.</p>
    </div>
  )
}
