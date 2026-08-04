'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, MoreVertical } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProfileRow {
  id: string
  name?: string
  city?: string
  state?: string
  category?: string
  plan?: string
  status?: string
  verified?: boolean
  created?: string
  thumbnail?: string
}

export default function AdminPerfisPage() {
  const [data, setData] = useState<{
    items: ProfileRow[]
    totalItems: number
    page: number
    perPage: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/profiles?page=${page}&perPage=20`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d || { items: [], totalItems: 0, page: 1, perPage: 20 }))
      .catch(() => setData({ items: [], totalItems: 0, page: 1, perPage: 20 }))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const setProfileStatus = async (profileId: string, status: string) => {
    setMenuOpenId(null)
    setUpdatingId(profileId)
    try {
      const res = await fetch(`/api/admin/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success('Status atualizado')
        fetchData()
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error((d as { error?: string }).error || 'Erro ao atualizar')
      }
    } catch {
      toast.error('Erro ao atualizar')
    } finally {
      setUpdatingId(null)
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.totalItems / data.perPage)) : 1

  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-white">Perfis</h1>

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
                  <th className="p-4 font-medium text-slate-300">Foto</th>
                  <th className="p-4 font-medium text-slate-300">Nome</th>
                  <th className="p-4 font-medium text-slate-300">Cidade/UF</th>
                  <th className="p-4 font-medium text-slate-300">Categoria</th>
                  <th className="p-4 font-medium text-slate-300">Plano</th>
                  <th className="p-4 font-medium text-slate-300">Status</th>
                  <th className="p-4 font-medium text-slate-300">Verificado</th>
                  <th className="p-4 font-medium text-slate-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Nenhum perfil encontrado.
                    </td>
                  </tr>
                ) : (
                  data?.items.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="p-4">
                        {p.thumbnail ? (
                          <img
                            src={p.thumbnail}
                            alt={p.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-slate-700" />
                        )}
                      </td>
                      <td className="p-4 font-medium text-white">{p.name ?? '-'}</td>
                      <td className="p-4 text-slate-300">{p.city}, {p.state}</td>
                      <td className="p-4 text-slate-300">{p.category ?? '-'}</td>
                      <td className="p-4 text-slate-300">{p.plan ?? '-'}</td>
                      <td className="p-4 text-slate-300">{p.status ?? '-'}</td>
                      <td className="p-4">
                        {p.verified ? (
                          <span className="text-green-400">Sim</span>
                        ) : (
                          <span className="text-slate-500">Não</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/perfil/${p.id}`}
                            className="text-primary-500 hover:underline"
                          >
                            Ver
                          </Link>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                              disabled={updatingId === p.id}
                              className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50"
                              aria-label="Ações"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {menuOpenId === p.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  aria-hidden
                                  onClick={() => setMenuOpenId(null)}
                                />
                                <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-slate-600 bg-slate-800 py-1 shadow-xl">
                                  <button
                                    type="button"
                                    onClick={() => setProfileStatus(p.id, 'active')}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
                                  >
                                    Reativar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setProfileStatus(p.id, 'suspended')}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
                                  >
                                    Suspender
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setProfileStatus(p.id, 'archived')}
                                    className="w-full px-4 py-2 text-left text-sm text-amber-400 hover:bg-slate-700"
                                  >
                                    Arquivar
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
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
