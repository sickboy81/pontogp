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
  /** Valores em settings (PocketBase `expiration_durations`); vazio = sem override, o PIX herda o plano. */
  const [expirationDurations, setExpirationDurations] = useState<
    Record<string, { contact_days?: number; search_days?: number }>
  >({})
  const [plansForExp, setPlansForExp] = useState<
    { id: string; slug: string; name: string; subscription_days?: number }[]
  >([])
  const [savingExpiration, setSavingExpiration] = useState(false)
  const [visibilityPolicy, setVisibilityPolicy] = useState<{
    blur_after_days: number
    remove_from_search_after_days: number
    archive_after_days: number
  }>({
    blur_after_days: 7,
    remove_from_search_after_days: 30,
    archive_after_days: 90,
  })

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
        if (exp?.durations && typeof exp.durations === 'object') {
          setExpirationDurations(exp.durations as Record<string, { contact_days?: number; search_days?: number }>)
        }
        if (exp?.visibility_policy && typeof exp.visibility_policy === 'object') {
          const p = exp.visibility_policy as Partial<{
            blur_after_days: number
            remove_from_search_after_days: number
            archive_after_days: number
          }>
          setVisibilityPolicy({
            blur_after_days:
              typeof p.blur_after_days === 'number' ? Math.floor(p.blur_after_days) : 7,
            remove_from_search_after_days:
              typeof p.remove_from_search_after_days === 'number'
                ? Math.floor(p.remove_from_search_after_days)
                : 30,
            archive_after_days:
              typeof p.archive_after_days === 'number' ? Math.floor(p.archive_after_days) : 90,
          })
        }
        if (Array.isArray(plansList)) {
          setPlansForExp(
            plansList.map(
              (p: { id: string; slug: string; name: string; subscription_days?: number }) => ({
                id: p.id,
                slug: p.slug,
                name: p.name,
                subscription_days: p.subscription_days,
              })
            )
          )
        }
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

  const setDurationField = (slug: string, field: 'contact_days' | 'search_days', raw: string) => {
    setExpirationDurations((prev) => {
      const v = raw.trim()
      const cur = { ...(prev[slug] || {}) }
      if (v === '') {
        delete cur[field]
      } else {
        const n = parseInt(v, 10)
        if (Number.isNaN(n) || n < 1) return prev
        cur[field] = Math.min(365, n)
      }
      const next = { ...prev }
      if (Object.keys(cur).length === 0) {
        delete next[slug]
      } else {
        next[slug] = cur
      }
      return next
    })
  }

  const handleSaveExpiration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      visibilityPolicy.blur_after_days >= visibilityPolicy.remove_from_search_after_days ||
      visibilityPolicy.remove_from_search_after_days >= visibilityPolicy.archive_after_days
    ) {
      toast.error('Use a ordem: desfocar < retirar das buscas < arquivar.')
      return
    }
    setSavingExpiration(true)
    try {
      const res = await fetch('/api/admin/expiration-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          durations: expirationDurations,
          visibility_policy: visibilityPolicy,
        }),
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

  const setVisibilityField = (
    key: 'blur_after_days' | 'remove_from_search_after_days' | 'archive_after_days',
    raw: string
  ) => {
    const n = parseInt(raw, 10)
    if (Number.isNaN(n)) return
    setVisibilityPolicy((prev) => ({ ...prev, [key]: Math.max(1, Math.min(365, n)) }))
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
            Override gravado em <code className="text-slate-300">settings.expiration_durations</code> (PocketBase). Deixe
            vazio para não sobrescrever: o PIX usa o campo <code className="text-slate-300">subscription_days</code> de
            cada registo de plano; se estiver vazio, o código do webhook usa 30 dias.
          </p>
          <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Visibilidade pós-vencimento
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm text-slate-300">
                <span className="mb-1 block text-xs text-slate-500">Desfocar após (dias)</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={visibilityPolicy.blur_after_days}
                  onChange={(e) => setVisibilityField('blur_after_days', e.target.value)}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-white"
                />
              </label>
              <label className="text-sm text-slate-300">
                <span className="mb-1 block text-xs text-slate-500">Retirar das buscas após (dias)</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={visibilityPolicy.remove_from_search_after_days}
                  onChange={(e) => setVisibilityField('remove_from_search_after_days', e.target.value)}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-white"
                />
              </label>
              <label className="text-sm text-slate-300">
                <span className="mb-1 block text-xs text-slate-500">Arquivar após (dias)</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={visibilityPolicy.archive_after_days}
                  onChange={(e) => setVisibilityField('archive_after_days', e.target.value)}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-white"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Os valores devem respeitar a ordem: desfocar, retirar das buscas e arquivar.
            </p>
          </div>
          <p className="mb-2 text-xs text-amber-400/90">
            Se antes vias sempre o número 30, era o <em>placeholder</em> (cinzento), não o valor no BD. Agora a coluna
            &quot;Padrão (plano)&quot; mostra o que vem do cadastro de planos.
          </p>
          <form onSubmit={handleSaveExpiration} className="mt-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600 text-left text-slate-400">
                    <th className="pb-2 pr-2">Plano</th>
                    <th className="pb-2 pr-2">Padrão (plano / BD)</th>
                    <th className="pb-2 pr-2">Contato (override)</th>
                    <th className="pb-2">Busca (override)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {plansForExp.map((p) => {
                    const planBase = p.subscription_days != null && p.subscription_days > 0 ? p.subscription_days : null
                    return (
                    <tr key={p.id}>
                      <td className="py-2 pr-2 font-medium text-slate-200">
                        {p.name || p.slug}
                        <p className="text-[10px] font-normal text-slate-500">slug: {p.slug}</p>
                      </td>
                      <td className="max-w-[100px] py-2 pr-2 text-slate-300">
                        {planBase != null ? (
                          <span className="font-mono text-emerald-400/90">{planBase} dias</span>
                        ) : (
                          <span className="text-slate-500" title="Campo vazio no plano — PIX usa 30 no código">— (30 no código)</span>
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={
                            expirationDurations[p.slug]?.contact_days != null
                              ? String(expirationDurations[p.slug]!.contact_days)
                              : ''
                          }
                          onChange={(e) => setDurationField(p.slug, 'contact_days', e.target.value)}
                          placeholder="vazio = herda"
                          className="w-24 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white placeholder:text-slate-600"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={
                            expirationDurations[p.slug]?.search_days != null
                              ? String(expirationDurations[p.slug]!.search_days)
                              : ''
                          }
                          onChange={(e) => setDurationField(p.slug, 'search_days', e.target.value)}
                          placeholder="vazio = herda"
                          className="w-24 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white placeholder:text-slate-600"
                        />
                      </td>
                    </tr>
                    )
                  })}
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
