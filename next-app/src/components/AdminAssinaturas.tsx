'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface SubscriptionRow {
  id: string
  user_email: string | null
  plan_name: string | null
  status: string | null
  amount: number
  starts_at: string | null
  expires_at: string | null
  auto_renew: boolean
}

export default function AdminAssinaturas() {
  const [items, setItems] = useState<SubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/subscriptions?page=1&perPage=100&status=${status}`, { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error('Erro')
      setItems(((data as { items?: SubscriptionRow[] }).items || []) as SubscriptionRow[])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status])

  const toggleAutoRenew = async (id: string, value: boolean) => {
    const res = await fetch(`/api/admin/subscriptions/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_renew: !value }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error((json as { error?: string }).error || 'Erro ao atualizar assinatura')
      return
    }
    toast.success('Assinatura atualizada')
    load()
  }

  const formatDate = (value: string | null) => {
    if (!value) return '-'
    try {
      return new Date(value).toLocaleDateString('pt-BR')
    } catch {
      return value
    }
  }

  return (
    <div>
      <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Assinaturas</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativa</option>
          <option value="expired">Expirada</option>
          <option value="canceled">Cancelada</option>
          <option value="pending">Pendente</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-700 bg-slate-800/50">
              <tr>
                <th className="p-4 text-slate-300">Usuário</th>
                <th className="p-4 text-slate-300">Plano</th>
                <th className="p-4 text-slate-300">Valor</th>
                <th className="p-4 text-slate-300">Status</th>
                <th className="p-4 text-slate-300">Início</th>
                <th className="p-4 text-slate-300">Expira em</th>
                <th className="p-4 text-slate-300">Auto-renovação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhuma assinatura encontrada (ou coleção `subscriptions` ausente neste ambiente).
                  </td>
                </tr>
              ) : items.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/30">
                  <td className="p-4 text-slate-300">{row.user_email || '-'}</td>
                  <td className="p-4 text-slate-300">{row.plan_name || '-'}</td>
                  <td className="p-4 text-white">R$ {Number(row.amount || 0).toFixed(2)}</td>
                  <td className="p-4 text-slate-300">{row.status || '-'}</td>
                  <td className="p-4 text-slate-300">{formatDate(row.starts_at)}</td>
                  <td className="p-4 text-slate-300">{formatDate(row.expires_at)}</td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => toggleAutoRenew(row.id, row.auto_renew)}
                      className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                    >
                      {row.auto_renew ? 'Desativar' : 'Ativar'}
                    </button>
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
