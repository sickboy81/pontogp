'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Loader2, Trash2, XCircle } from 'lucide-react'

interface Report {
  id: string
  reported_profile_id: string
  reason: string
  description?: string
  status: string
  created: string
  reported_profile_name?: string
  reported_profile_slug?: string
  reported_by_email?: string
  reported_by_name?: string
}

export default function AdminDenuncias() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReports()
  }, [filter])

  const loadReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/reports?status=${filter}&perPage=50`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Erro ao carregar denúncias')
      const data = await res.json()
      setReports(data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar')
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string, status: string) => {
    setUpdating(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      await loadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar')
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (id: string) => {
    setUpdating(id)
    setError(null)
    setDeleteConfirm(null)
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Erro ao excluir')
      await loadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setUpdating(null)
    }
  }

  const formatDate = (d: string) => {
    if (!d) return '-'
    try {
      return new Date(d).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return d
    }
  }

  const displayed = reports

  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-white">Denúncias</h1>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'pending'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
          }`}
        >
          Todas
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando denúncias...</span>
        </div>
      ) : displayed.length === 0 ? (
        <p className="py-12 text-center text-slate-400">
          {filter === 'pending' ? 'Nenhuma denúncia pendente' : 'Nenhuma denúncia encontrada'}
        </p>
      ) : (
        <div className="space-y-4">
          {displayed.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">
                    Perfil denunciado:{' '}
                    <Link
                      href={`/perfil/${r.reported_profile_id}`}
                      className="text-primary-400 hover:underline"
                    >
                      {r.reported_profile_name || r.reported_profile_id}
                    </Link>
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Motivo: {r.reason}
                    {r.description && (
                      <span className="ml-1 text-slate-500">— {r.description}</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Denunciante: {r.reported_by_email || r.reported_by_name || 'Anônimo'} • {formatDate(r.created)}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded px-2 py-0.5 text-xs ${
                      r.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300'
                        : r.status === 'resolved'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdate(r.id, 'resolved')}
                        disabled={!!updating}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
                      >
                        {updating === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Resolver
                      </button>
                      <button
                        onClick={() => handleUpdate(r.id, 'dismissed')}
                        disabled={!!updating}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-500 disabled:opacity-50"
                      >
                        {updating === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Dispensar
                      </button>
                    </>
                  )}
                  {deleteConfirm === r.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={!!updating}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded-lg bg-slate-600 px-3 py-2 text-sm text-white hover:bg-slate-500"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(r.id)}
                      disabled={!!updating}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
