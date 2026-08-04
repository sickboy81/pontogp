'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Loader2, XCircle } from 'lucide-react'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

interface VerificationRequest {
  id: string
  profile: string
  user?: string
  status: string
  created: string
  expand?: {
    profile?: { id: string; name: string }
    user?: { email: string; name?: string }
  }
  document_front?: string
  document_back?: string
  selfie?: string
}

function fileUrl(collection: string, recordId: string, filename: string) {
  return `${PB_URL}/api/files/${collection}/${recordId}/${filename}`
}

export default function AdminVerificacao() {
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/verification?status=${filter}`, {
        credentials: 'include',
      })
      const data = await res.json()
      setRequests(data.items || [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    void load()
  }, [load])

  const handleUpdate = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/verification/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, rejection_reason: reason }),
      })
      if (!res.ok) throw new Error('Erro')
      await load()
    } catch {
      // error
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
      })
    } catch {
      return d
    }
  }

  const displayed = filter === 'all' ? requests : requests

  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-white">Solicitações de Verificação</h1>

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

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          Carregando...
        </div>
      ) : displayed.length === 0 ? (
        <p className="py-12 text-center text-slate-400">
          {filter === 'pending' ? 'Nenhuma solicitação pendente' : 'Nenhuma solicitação encontrada'}
        </p>
      ) : (
        <div className="space-y-6">
          {displayed.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">
                    Perfil:{' '}
                    <Link
                      href={`/perfil/${r.expand?.profile?.id || r.profile}`}
                      className="text-primary-400 hover:underline"
                    >
                      {r.expand?.profile?.name || r.profile}
                    </Link>
                  </p>
                  <p className="text-sm text-slate-500">
                    {r.expand?.user?.email || r.user} • {formatDate(r.created)}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-1 text-xs ${
                    r.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-300'
                      : r.status === 'approved'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-4">
                {r.document_front && (
                  <a
                    href={fileUrl('verification_requests', r.id, r.document_front)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="overflow-hidden rounded-lg border border-slate-600 bg-slate-700"
                  >
                    <img
                      src={fileUrl('verification_requests', r.id, r.document_front)}
                      alt="Documento frente"
                      className="h-32 w-full object-cover"
                    />
                    <p className="p-2 text-center text-xs text-slate-400">Documento - Frente</p>
                  </a>
                )}
                {r.document_back && (
                  <a
                    href={fileUrl('verification_requests', r.id, r.document_back)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="overflow-hidden rounded-lg border border-slate-600 bg-slate-700"
                  >
                    <img
                      src={fileUrl('verification_requests', r.id, r.document_back)}
                      alt="Documento verso"
                      className="h-32 w-full object-cover"
                    />
                    <p className="p-2 text-center text-xs text-slate-400">Documento - Verso</p>
                  </a>
                )}
                {r.selfie && (
                  <a
                    href={fileUrl('verification_requests', r.id, r.selfie)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="overflow-hidden rounded-lg border border-slate-600 bg-slate-700"
                  >
                    <img
                      src={fileUrl('verification_requests', r.id, r.selfie)}
                      alt="Selfie"
                      className="h-32 w-full object-cover"
                    />
                    <p className="p-2 text-center text-xs text-slate-400">Selfie</p>
                  </a>
                )}
              </div>
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(r.id, 'approved')}
                    disabled={!!updating}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
                  >
                    {updating === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleUpdate(r.id, 'rejected')}
                    disabled={!!updating}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                  >
                    {updating === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
