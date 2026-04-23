'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface PlanRow {
  id: string
  name?: string
  slug?: string
  enabled?: boolean
  price_monthly?: number
  price_weekly?: number
  daily_bumps?: number
  max_photos?: number
  target_type?: string
  created?: string
  features?: unknown
}

function featuresToText(features: unknown): string {
  if (!Array.isArray(features)) return ''
  return features
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n')
}

function textToFeatures(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  enabled: true,
  price_monthly: 0,
  price_weekly: 0,
  daily_bumps: 0,
  max_photos: 10,
  target_type: 'advertiser',
  featuresText: '',
}

export default function AdminPlanos() {
  const [items, setItems] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/plans?page=1&perPage=100', { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Erro')
      setItems(((data as { items?: PlanRow[] }).items || []) as PlanRow[])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const onEdit = (plan: PlanRow) => {
    setEditingId(plan.id)
    setShowForm(true)
    setForm({
      name: plan.name || '',
      slug: plan.slug || '',
      enabled: !!plan.enabled,
      price_monthly: Number(plan.price_monthly) || 0,
      price_weekly: Number(plan.price_weekly) || 0,
      daily_bumps: Number(plan.daily_bumps) || 0,
      max_photos: Number(plan.max_photos) || 10,
      target_type: plan.target_type || 'advertiser',
      featuresText: featuresToText(plan.features),
    })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Preencha nome e slug')
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/plans/${editingId}` : '/api/admin/plans'
      const method = editingId ? 'PATCH' : 'POST'
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        enabled: form.enabled,
        price_monthly: form.price_monthly,
        price_weekly: form.price_weekly,
        daily_bumps: form.daily_bumps,
        max_photos: form.max_photos,
        target_type: form.target_type,
        features: textToFeatures(form.featuresText),
      }
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((json as { error?: string }).error || 'Erro ao salvar plano')
        return
      }
      toast.success(editingId ? 'Plano atualizado' : 'Plano criado')
      setShowForm(false)
      resetForm()
      load()
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id: string) => {
    const ok = window.confirm('Deseja excluir este plano?')
    if (!ok) return
    const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE', credentials: 'include' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error((json as { error?: string }).error || 'Erro ao excluir plano')
      return
    }
    toast.success('Plano excluído')
    load()
  }

  return (
    <div>
      <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>

      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Planos</h1>
        <button
          type="button"
          onClick={() => {
            if (showForm) resetForm()
            setShowForm((v) => !v)
          }}
          className={
            showForm
              ? 'inline-flex items-center gap-2 rounded-lg border border-slate-500 bg-slate-700/80 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600'
              : 'inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500'
          }
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancelar' : 'Novo plano'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mb-6 space-y-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="admin-plan-name" className="mb-1 block text-xs font-medium text-slate-300">
                Nome do plano <span className="text-primary-400">*</span>
              </label>
              <input
                id="admin-plan-name"
                className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                autoComplete="off"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="admin-plan-slug" className="mb-1 block text-xs font-medium text-slate-300">
                Slug <span className="text-primary-400">*</span>
              </label>
              <p className="mb-1 text-[11px] text-slate-500">ID interno (ex.: prata, ouro, gratis). Só letras minúsculas, sem espaços.</p>
              <input
                id="admin-plan-slug"
                className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                autoComplete="off"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="admin-plan-target" className="mb-1 block text-xs font-medium text-slate-300">
                Tipo de público
              </label>
              <p className="mb-1 text-[11px] text-slate-500">A quem o plano se aplica no sistema.</p>
              <select
                id="admin-plan-target"
                className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                value={form.target_type}
                onChange={(e) => setForm((f) => ({ ...f, target_type: e.target.value }))}
              >
                <option value="advertiser">Anunciante (perfil de anúncio)</option>
                <option value="user">Usuário (conta comum)</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="admin-plan-price-monthly" className="mb-1 block text-xs font-medium text-slate-300">
                Preço mensal (R$)
              </label>
              <p className="mb-1 text-[11px] text-slate-500">Cobrado no período &quot;Mensal&quot; na vitrine de planos.</p>
              <input
                id="admin-plan-price-monthly"
                type="number"
                min={0}
                step={0.01}
                className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                value={form.price_monthly}
                onChange={(e) => setForm((f) => ({ ...f, price_monthly: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label htmlFor="admin-plan-price-weekly" className="mb-1 block text-xs font-medium text-slate-300">
                Preço semanal (R$)
              </label>
              <p className="mb-1 text-[11px] text-slate-500">Cobrado no período &quot;Semanal&quot; na vitrine de planos.</p>
              <input
                id="admin-plan-price-weekly"
                type="number"
                min={0}
                step={0.01}
                className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                value={form.price_weekly}
                onChange={(e) => setForm((f) => ({ ...f, price_weekly: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label htmlFor="admin-plan-bumps" className="mb-1 block text-xs font-medium text-slate-300">
                Bumps por dia
              </label>
              <p className="mb-1 text-[11px] text-slate-500">Subidas diárias permitidas do anúncio (destaque na lista).</p>
              <input
                id="admin-plan-bumps"
                type="number"
                min={0}
                step={1}
                className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                value={form.daily_bumps}
                onChange={(e) => setForm((f) => ({ ...f, daily_bumps: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div>
            <label htmlFor="admin-plan-features" className="mb-1 block text-xs font-medium text-slate-300">
              Texto dos itens do card (página /planos)
            </label>
            <p className="mb-2 text-[11px] text-slate-500">
              Uma linha = um item com ✓ na vitrine. Inclua tudo o que quiser mostrar (fotos, bumps, extras).
              Deixe em branco para a página usar só o resumo automático (máx. de fotos + bumps/dia).
            </p>
            <textarea
              id="admin-plan-features"
              rows={6}
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 font-mono text-sm text-white placeholder:text-slate-600"
              placeholder={'Ex.:\n10 fotos\n6 bumps/dia\n6 subidas diárias\nLink na Bio'}
              value={form.featuresText}
              onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="admin-plan-max-photos" className="mb-1 block text-xs font-medium text-slate-300">
                Máximo de fotos no perfil
              </label>
              <p className="mb-1 text-[11px] text-slate-500">Limite de mídias do anunciante com este plano.</p>
              <input
                id="admin-plan-max-photos"
                type="number"
                min={0}
                step={1}
                className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                value={form.max_photos}
                onChange={(e) => setForm((f) => ({ ...f, max_photos: Number(e.target.value) || 0 }))}
              />
            </div>
            <label
              htmlFor="admin-plan-enabled"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm text-slate-200"
            >
              <input
                id="admin-plan-enabled"
                type="checkbox"
                className="rounded border-slate-500 text-primary-500 focus:ring-primary-500"
                checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              />
              <span>Plano ativo (aparece na listagem pública de planos)</span>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="shrink-0 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar plano'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-700 bg-slate-800/50">
              <tr>
                <th className="p-4 text-slate-300">Plano</th>
                <th className="p-4 text-slate-300">Preço mensal</th>
                <th className="p-4 text-slate-300">Bumps</th>
                <th className="p-4 text-slate-300">Status</th>
                <th className="p-4 text-slate-300">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Nenhum plano encontrado.</td>
                </tr>
              ) : items.map((plan) => (
                <tr key={plan.id} className="hover:bg-slate-800/30">
                  <td className="p-4 text-white">{plan.name || plan.slug}</td>
                  <td className="p-4 text-slate-300">R$ {Number(plan.price_monthly || 0).toFixed(2)}</td>
                  <td className="p-4 text-slate-300">{plan.daily_bumps ?? 0}</td>
                  <td className="p-4">
                    <span className={plan.enabled ? 'text-green-400' : 'text-slate-500'}>{plan.enabled ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => onEdit(plan)} className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => onDelete(plan.id)} className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
