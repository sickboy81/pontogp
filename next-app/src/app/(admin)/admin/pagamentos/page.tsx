'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface PaymentRow {
  id: string
  user_id: string
  user_email: string | null
  plan_id: string | null
  plan_name: string | null
  amount: number
  status: string
  method: string
  external_id: string | null
  created: string
}

export default function AdminPagamentosPage() {
  const [data, setData] = useState<{
    items: PaymentRow[]
    totalItems: number
    page: number
    perPage: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), perPage: '20' })
    if (statusFilter !== 'all') params.set('status', statusFilter)
    fetch(`/api/admin/payments?${params}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d || { items: [], totalItems: 0, page: 1, perPage: 20 }))
      .catch(() => setData({ items: [], totalItems: 0, page: 1, perPage: 20 }))
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  const totalPages = data ? Math.max(1, Math.ceil(data.totalItems / data.perPage)) : 1

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return s
    }
  }

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n))

  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-white">Pagamentos</h1>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="text-sm text-slate-400">
          Status:
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="ml-2 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white"
          >
            <option value="all">Todos</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
            <option value="failed">Falhou</option>
            <option value="refunded">Reembolsado</option>
          </select>
        </label>
      </div>

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
                  <th className="p-4 font-medium text-slate-300">Data</th>
                  <th className="p-4 font-medium text-slate-300">Usuário</th>
                  <th className="p-4 font-medium text-slate-300">Plano</th>
                  <th className="p-4 font-medium text-slate-300">Valor</th>
                  <th className="p-4 font-medium text-slate-300">Status</th>
                  <th className="p-4 font-medium text-slate-300">Método</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Nenhum pagamento encontrado.
                    </td>
                  </tr>
                ) : (
                  data?.items.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-800/30">
                      <td className="p-4 text-slate-300">{formatDate(pay.created)}</td>
                      <td className="p-4 text-slate-300">{pay.user_email ?? pay.user_id ?? '-'}</td>
                      <td className="p-4 text-slate-300">{pay.plan_name ?? '-'}</td>
                      <td className="p-4 font-medium text-white">{formatMoney(pay.amount)}</td>
                      <td className="p-4">
                        <span
                          className={
                            pay.status === 'paid'
                              ? 'text-green-400'
                              : pay.status === 'failed'
                                ? 'text-red-400'
                                : 'text-slate-300'
                          }
                        >
                          {pay.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">{pay.method ?? '-'}</td>
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
