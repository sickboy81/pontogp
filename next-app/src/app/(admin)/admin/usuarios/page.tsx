'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface UserRow {
  id: string
  email?: string
  name?: string
  role?: string
  status?: string
  verified?: boolean
  created?: string
}

export default function AdminUsuariosPage() {
  const [data, setData] = useState<{
    items: UserRow[]
    totalItems: number
    page: number
    perPage: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/users?page=${page}&perPage=20`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d || { items: [], totalItems: 0, page: 1, perPage: 20 }))
      .catch(() => setData({ items: [], totalItems: 0, page: 1, perPage: 20 }))
      .finally(() => setLoading(false))
  }, [page])

  const totalPages = data
    ? Math.max(1, Math.ceil(data.totalItems / data.perPage))
    : 1

  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-white">Usuários</h1>

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
                  <th className="p-4 font-medium text-slate-300">Email</th>
                  <th className="p-4 font-medium text-slate-300">Nome</th>
                  <th className="p-4 font-medium text-slate-300">Role</th>
                  <th className="p-4 font-medium text-slate-300">Status</th>
                  <th className="p-4 font-medium text-slate-300">Verificado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  data?.items.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="p-4 text-white">{u.email ?? '-'}</td>
                      <td className="p-4 text-slate-300">{u.name ?? '-'}</td>
                      <td className="p-4 text-slate-300">{u.role ?? '-'}</td>
                      <td className="p-4 text-slate-300">{u.status ?? '-'}</td>
                      <td className="p-4">
                        {u.verified ? (
                          <span className="text-green-400">Sim</span>
                        ) : (
                          <span className="text-slate-500">Não</span>
                        )}
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
