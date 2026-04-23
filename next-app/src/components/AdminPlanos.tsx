'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
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
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          slug: form.slug.trim().toLowerCase(),
        }),
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
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancelar' : 'Novo plano'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4 md:grid-cols-3">
          <input className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white" placeholder="Nome*" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white" placeholder="Slug*" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          <select className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white" value={form.target_type} onChange={(e) => setForm((f) => ({ ...f, target_type: e.target.value }))}>
            <option value="advertiser">Anunciante</option>
            <option value="user">Usuário</option>
          </select>
          <input type="number" className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white" placeholder="Preço mensal" value={form.price_monthly} onChange={(e) => setForm((f) => ({ ...f, price_monthly: Number(e.target.value) || 0 }))} />
          <input type="number" className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white" placeholder="Preço semanal" value={form.price_weekly} onChange={(e) => setForm((f) => ({ ...f, price_weekly: Number(e.target.value) || 0 }))} />
          <input type="number" className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white" placeholder="Bumps/dia" value={form.daily_bumps} onChange={(e) => setForm((f) => ({ ...f, daily_bumps: Number(e.target.value) || 0 }))} />
          <input type="number" className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white" placeholder="Máx. fotos" value={form.max_photos} onChange={(e) => setForm((f) => ({ ...f, max_photos: Number(e.target.value) || 0 }))} />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
            Plano ativo
          </label>
          <button type="submit" disabled={saving} className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50">
            {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar plano'}
          </button>
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
