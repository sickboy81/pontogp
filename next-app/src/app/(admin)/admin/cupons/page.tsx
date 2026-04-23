'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import type { Plan } from '@/lib/types'
import toast from 'react-hot-toast'

interface CouponRow {
  id: string
  code: string
  plan_id: string
  plan_name: string | null
  duration_days: number
  max_uses: number | null
  used_count: number
  active: boolean
  expires_at: string | null
  created: string
  updated: string
}

export default function AdminCuponsPage() {
  const [data, setData] = useState<{
    items: CouponRow[]
    totalItems: number
    page: number
    perPage: number
  } | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    code: '',
    plan_id: '',
    duration_days: 30,
    max_uses: '' as number | '',
    expires_at: '',
    active: true,
  })
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [editingCoupon, setEditingCoupon] = useState<CouponRow | null>(null)
  const [editForm, setEditForm] = useState({
    code: '',
    plan_id: '',
    duration_days: 30,
    max_uses: '' as number | '',
    expires_at: '',
    active: true,
  })
  const [savingEdit, setSavingEdit] = useState(false)

  const loadCoupons = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), perPage: '30' })
    fetch(`/api/admin/coupons?${params}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d || { items: [], totalItems: 0, page: 1, perPage: 30 }))
      .catch(() => setData({ items: [], totalItems: 0, page: 1, perPage: 30 }))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    loadCoupons()
  }, [loadCoupons])

  useEffect(() => {
    fetch('/api/plans?enabledOnly=false', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Plan[]) => setPlans(list || []))
      .catch(() => setPlans([]))
  }, [])

  const totalPages = data ? Math.max(1, Math.ceil(data.totalItems / data.perPage)) : 1

  const formatDate = (s: string | null) => {
    if (!s) return '-'
    try {
      return new Date(s).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return s
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.plan_id) {
      toast.error('Preencha código e plano')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          plan_id: form.plan_id,
          duration_days: form.duration_days,
          max_uses: form.max_uses === '' ? undefined : Number(form.max_uses),
          expires_at: form.expires_at.trim() || null,
          active: form.active,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((json as { error?: string }).error || 'Erro ao criar cupom')
        return
      }
      toast.success('Cupom criado')
      setForm({ code: '', plan_id: '', duration_days: 30, max_uses: '', expires_at: '', active: true })
      setShowForm(false)
      loadCoupons()
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (c: CouponRow) => {
    setEditingCoupon(c)
    setEditForm({
      code: c.code,
      plan_id: c.plan_id,
      duration_days: c.duration_days,
      max_uses: c.max_uses ?? '',
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
      active: c.active,
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCoupon) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: editForm.code.trim(),
          plan_id: editForm.plan_id,
          duration_days: editForm.duration_days,
          max_uses: editForm.max_uses === '' ? null : Number(editForm.max_uses),
          expires_at: editForm.expires_at.trim() || null,
          active: editForm.active,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((json as { error?: string }).error || 'Erro ao atualizar')
        return
      }
      toast.success('Cupom atualizado')
      setEditingCoupon(null)
      loadCoupons()
    } finally {
      setSavingEdit(false)
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !current }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((json as { error?: string }).error || 'Erro ao atualizar')
        return
      }
      toast.success(current ? 'Cupom desativado' : 'Cupom ativado')
      loadCoupons()
    } finally {
      setTogglingId(null)
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Cupons</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancelar' : 'Novo cupom'}
        </button>
      </div>

      {editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingCoupon(null)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-white">Editar cupom</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Código *</label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  maxLength={20}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Plano *</label>
                <select
                  value={editForm.plan_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, plan_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.slug}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Duração (dias)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={editForm.duration_days}
                    onChange={(e) => setEditForm((f) => ({ ...f, duration_days: Number(e.target.value) || 30 }))}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Máx. usos</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.max_uses}
                    onChange={(e) => setEditForm((f) => ({ ...f, max_uses: e.target.value === '' ? '' : Number(e.target.value) }))}
                    placeholder="Ilimitado"
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Expira em</label>
                <input
                  type="date"
                  value={editForm.expires_at}
                  onChange={(e) => setEditForm((f) => ({ ...f, expires_at: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500"
                />
                Ativo
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
                >
                  {savingEdit ? <Loader2 className="inline h-4 w-4 animate-spin" /> : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Criar cupom</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Código *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="EX: PROMO30"
                maxLength={20}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Plano *</label>
              <select
                value={form.plan_id}
                onChange={(e) => setForm((f) => ({ ...f, plan_id: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="">Selecione</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.slug}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Duração (dias)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={form.duration_days}
                onChange={(e) => setForm((f) => ({ ...f, duration_days: Number(e.target.value) || 30 }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Máx. usos (vazio = ilimitado)</label>
              <input
                type="number"
                min={0}
                value={form.max_uses}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value === '' ? '' : Number(e.target.value) }))}
                placeholder="Ilimitado"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Expira em (opcional)</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500"
                />
                Ativo
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="inline h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                'Criar cupom'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-700 bg-slate-800/50">
                <tr>
                  <th className="p-4 font-medium text-slate-300">Código</th>
                  <th className="p-4 font-medium text-slate-300">Plano</th>
                  <th className="p-4 font-medium text-slate-300">Dias</th>
                  <th className="p-4 font-medium text-slate-300">Usos</th>
                  <th className="p-4 font-medium text-slate-300">Expira</th>
                  <th className="p-4 font-medium text-slate-300">Ativo</th>
                  <th className="p-4 font-medium text-slate-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhum cupom. Clique em &quot;Novo cupom&quot; para criar.
                    </td>
                  </tr>
                ) : (
                  data?.items.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-medium text-white">{c.code}</td>
                      <td className="p-4 text-slate-300">{c.plan_name ?? '-'}</td>
                      <td className="p-4 text-slate-300">{c.duration_days}</td>
                      <td className="p-4 text-slate-300">
                        {c.used_count}
                        {c.max_uses != null ? ` / ${c.max_uses}` : ''}
                      </td>
                      <td className="p-4 text-slate-300">{formatDate(c.expires_at)}</td>
                      <td className="p-4">
                        <span
                          className={
                            c.active ? 'text-green-400' : 'text-slate-500'
                          }
                        >
                          {c.active ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(c.id, c.active)}
                            disabled={togglingId === c.id}
                            className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                          >
                            {togglingId === c.id ? (
                              <Loader2 className="inline h-3 w-3 animate-spin" />
                            ) : c.active ? (
                              'Desativar'
                            ) : (
                              'Ativar'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 disabled:opacity-50 hover:bg-slate-800"
              >
                Anterior
              </button>
              <span className="text-slate-400">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 disabled:opacity-50 hover:bg-slate-800"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
