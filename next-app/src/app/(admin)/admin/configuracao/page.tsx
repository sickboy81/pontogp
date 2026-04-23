'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminConfiguracaoPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('Site em manutenção. Voltaremos em breve!')
  const [announcementEnabled, setAnnouncementEnabled] = useState(false)
  const [announcementMessage, setAnnouncementMessage] = useState('')
  const [announcementTarget, setAnnouncementTarget] = useState<'all' | 'guests' | 'logged_in' | 'advertiser'>('all')
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  const [expirationDurations, setExpirationDurations] = useState<Record<string, { contact_days: number; search_days: number }>>({})
  const [plansForExp, setPlansForExp] = useState<{ id: string; slug: string; name: string }[]>([])
  const [savingExpiration, setSavingExpiration] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/maintenance', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/admin/announcement', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/admin/expiration-settings', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/plans?enabledOnly=false', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([maint, ann, exp, plansList]) => {
        if (maint) {
          setEnabled(maint.enabled ?? false)
          setMessage(maint.message ?? 'Site em manutenção. Voltaremos em breve!')
        }
        if (ann) {
          setAnnouncementEnabled(ann.enabled ?? false)
          setAnnouncementMessage(ann.message ?? '')
          setAnnouncementTarget(ann.target === 'guests' || ann.target === 'logged_in' || ann.target === 'advertiser' ? ann.target : 'all')
        }
        if (exp?.durations) setExpirationDurations(exp.durations)
        if (Array.isArray(plansList)) setPlansForExp(plansList.map((p: { id: string; slug: string; name: string }) => ({ id: p.id, slug: p.slug, name: p.name })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled, message }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Erro ao salvar')
      }
      toast.success(enabled ? 'Modo manutenção ativado!' : 'Modo manutenção desativado!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveExpiration = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingExpiration(true)
    try {
      const res = await fetch('/api/admin/expiration-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ durations: expirationDurations }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Erro ao salvar')
      }
      toast.success('Durações de expiração salvas!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSavingExpiration(false)
    }
  }

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingAnnouncement(true)
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: announcementEnabled, message: announcementMessage, target: announcementTarget }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Erro ao salvar')
      }
      toast.success('Aviso do topo atualizado!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSavingAnnouncement(false)
    }
  }

  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-white">Configurações</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="max-w-xl space-y-6 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="rounded-lg border border-slate-700/60 bg-slate-900/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Atalhos</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link href="#manutencao" className="rounded border border-slate-600 px-2 py-1 text-slate-300 hover:border-primary-500 hover:text-white">Manutenção</Link>
              <Link href="#aviso-topo" className="rounded border border-slate-600 px-2 py-1 text-slate-300 hover:border-primary-500 hover:text-white">Aviso do topo</Link>
              <Link href="#expiracao-planos" className="rounded border border-slate-600 px-2 py-1 text-slate-300 hover:border-primary-500 hover:text-white">Expiração por plano</Link>
            </div>
          </div>

          <form id="manutencao" onSubmit={handleSave} className="space-y-6 scroll-mt-20">
            <h2 className="text-lg font-semibold text-white">Modo manutenção</h2>
            <p className="text-sm text-slate-400">
              Quando ativado, visitantes serão redirecionados para a página de manutenção. Admins continuam com acesso total.
            </p>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-slate-300">Ativar modo manutenção</span>
            </label>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Mensagem exibida
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Site em manutenção. Voltaremos em breve!"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 font-semibold text-white transition hover:bg-primary-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </form>

          <hr className="my-8 border-slate-700" />
          <h2 id="aviso-topo" className="scroll-mt-20 text-lg font-semibold text-white">Aviso do topo (AnnouncementBar)</h2>
          <p className="text-sm text-slate-400">
            Barra de aviso exibida no topo do site. Escolha para quem exibir. O usuário pode fechar até fechar o navegador.
          </p>
          <form onSubmit={handleSaveAnnouncement} className="mt-4 space-y-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-slate-300">Exibir aviso no topo</span>
            </label>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Público-alvo</label>
              <select
                value={announcementTarget}
                onChange={(e) => setAnnouncementTarget(e.target.value as 'all' | 'guests' | 'logged_in' | 'advertiser')}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">Todos</option>
                <option value="guests">Apenas visitantes (não logados)</option>
                <option value="logged_in">Apenas logados</option>
                <option value="advertiser">Apenas anunciantes</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Mensagem</label>
              <textarea
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Ex: Novidade: confira os novos planos!"
              />
            </div>
            <button
              type="submit"
              disabled={savingAnnouncement}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2.5 font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
            >
              {savingAnnouncement ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savingAnnouncement ? 'Salvando...' : 'Salvar aviso'}
            </button>
          </form>

          <hr className="my-8 border-slate-700" />
          <h2 id="expiracao-planos" className="scroll-mt-20 text-lg font-semibold text-white">Expiração por plano</h2>
          <p className="text-sm text-slate-400">
            Dias de visibilidade na busca e de exibição de contato após ativar/renovar o plano. Usado pelo webhook PIX. Se vazio, usa subscription_days do plano ou 30 dias.
          </p>
          <form onSubmit={handleSaveExpiration} className="mt-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600 text-left text-slate-400">
                    <th className="pb-2 pr-4">Plano</th>
                    <th className="pb-2 pr-4">Contato (dias)</th>
                    <th className="pb-2">Busca (dias)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {plansForExp.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 pr-4 font-medium text-slate-200">{p.name || p.slug}</td>
                      <td className="py-2 pr-4">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={expirationDurations[p.slug]?.contact_days ?? ''}
                          onChange={(e) =>
                            setExpirationDurations((prev) => ({
                              ...prev,
                              [p.slug]: {
                                ...prev[p.slug],
                                contact_days: Math.max(1, parseInt(e.target.value, 10) || 0),
                                search_days: prev[p.slug]?.search_days ?? 30,
                              },
                            }))
                          }
                          placeholder="30"
                          className="w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={expirationDurations[p.slug]?.search_days ?? ''}
                          onChange={(e) =>
                            setExpirationDurations((prev) => ({
                              ...prev,
                              [p.slug]: {
                                ...prev[p.slug],
                                contact_days: prev[p.slug]?.contact_days ?? 30,
                                search_days: Math.max(1, parseInt(e.target.value, 10) || 0),
                              },
                            }))
                          }
                          placeholder="30"
                          className="w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="submit"
              disabled={savingExpiration}
              className="inline-flex gap-2 rounded-lg bg-primary-600 px-6 py-2.5 font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
            >
              {savingExpiration ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savingExpiration ? 'Salvando...' : 'Salvar durações'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
