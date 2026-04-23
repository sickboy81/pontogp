'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserRow {
  id: string
  email?: string
  name?: string
  role?: string
  status?: string
  verified?: boolean
  created?: string
}

type EditForm = {
  name: string
  first_name: string
  last_name: string
  phone: string
  role: string
  status: string
  verified: boolean
  document_verified: boolean
}

const EMPTY: EditForm = {
  name: '',
  first_name: '',
  last_name: '',
  phone: '',
  role: 'user',
  status: 'active',
  verified: false,
  document_verified: false,
}

const ROLE_CHOICES: { value: string; label: string }[] = [
  { value: 'user', label: 'Utilizador' },
  { value: 'admin', label: 'Administrador' },
  { value: '1', label: 'Admin (código 1)' },
  { value: 'administrator', label: 'Administrator' },
]

const STATUS_CHOICES = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
]

function rowToForm(u: UserRow, detail?: Record<string, unknown> | null): EditForm {
  if (detail) {
    return {
      name: (detail.name as string) || '',
      first_name: (detail.first_name as string) || '',
      last_name: (detail.last_name as string) || '',
      phone: (detail.phone as string) || '',
      role: (detail.role as string) || 'user',
      status: (detail.status as string) || 'active',
      verified: !!(detail.verified as boolean),
      document_verified: !!(detail.document_verified as boolean),
    }
  }
  return {
    name: u.name || '',
    first_name: '',
    last_name: '',
    phone: '',
    role: u.role || 'user',
    status: u.status || 'active',
    verified: !!u.verified,
    document_verified: false,
  }
}

export default function AdminUsuarios() {
  const [data, setData] = useState<{
    items: UserRow[]
    totalItems: number
    page: number
    perPage: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [qDeb, setQDeb] = useState('')

  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<EditForm>(EMPTY)
  const [userEmail, setUserEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadDetail, setLoadDetail] = useState(false)
  const [userCreated, setUserCreated] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setQDeb(q.trim()), 350)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    setPage(1)
  }, [qDeb])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), perPage: '20' })
    if (qDeb.length >= 2) params.set('q', qDeb)
    try {
      const r = await fetch(`/api/admin/users?${params}`, { credentials: 'include' })
      const d = r.ok ? await r.json() : { items: [], totalItems: 0, page: 1, perPage: 20 }
      setData(d)
    } catch {
      setData({ items: [], totalItems: 0, page: 1, perPage: 20 })
    } finally {
      setLoading(false)
    }
  }, [page, qDeb])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!editId) return
    let cancel = false
    setLoadDetail(true)
    fetch(`/api/admin/users/${editId}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((detail) => {
        if (cancel || !detail) return
        setForm(rowToForm({} as UserRow, detail))
        setUserEmail((detail as { email?: string }).email || '')
        setUserCreated((detail as { created?: string }).created || null)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancel) setLoadDetail(false)
      })
    return () => {
      cancel = true
    }
  }, [editId])

  const openEdit = (u: UserRow) => {
    setEditId(u.id)
    setForm(rowToForm(u))
    setUserEmail(u.email || '')
    setUserCreated(null)
  }

  const closeEdit = () => {
    setEditId(null)
    setForm(EMPTY)
    setUserEmail('')
  }

  const save = async () => {
    if (!editId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim() || null,
          first_name: form.first_name.trim() || null,
          last_name: form.last_name.trim() || null,
          phone: form.phone.trim() || null,
          role: form.role,
          status: form.status,
          verified: form.verified,
          document_verified: form.document_verified,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((json as { error?: string }).error || 'Erro ao guardar')
        return
      }
      toast.success('Utilizador atualizado')
      closeEdit()
      load()
    } finally {
      setSaving(false)
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.totalItems / data.perPage)) : 1

  const currentRoleInList = ROLE_CHOICES.some((o) => o.value === form.role)

  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-white">Utilizadores</h1>
      <p className="mb-4 max-w-3xl text-sm text-slate-500">
        Pesquisa por email ou nome, abre <strong className="text-slate-400">Gerir</strong> para alterar função, estado
        da conta, verificação de email, nome e contacto. O email não pode ser alterado aqui (PocketBase).
      </p>

      <div className="mb-4 flex max-w-md flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-slate-500">Pesquisar (mín. 2 caracteres)</label>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="email ou parte do nome"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
        </div>
        <p className="text-xs text-slate-500">{data?.totalItems != null ? `${data.totalItems} contas` : ''}</p>
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
                  <th className="p-4 font-medium text-slate-300">Email</th>
                  <th className="p-4 font-medium text-slate-300">Nome</th>
                  <th className="p-4 font-medium text-slate-300">Função</th>
                  <th className="p-4 font-medium text-slate-300">Estado</th>
                  <th className="p-4 font-medium text-slate-300">Verificado</th>
                  <th className="p-4 font-medium text-slate-300" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Nenhum utilizador encontrado. Ajuste a pesquisa.
                    </td>
                  </tr>
                ) : (
                  data?.items.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="p-4 text-white">{u.email ?? '-'}</td>
                      <td className="p-4 text-slate-300">{u.name ?? '-'}</td>
                      <td className="p-4 text-slate-300 font-mono text-xs">{u.role ?? '-'}</td>
                      <td className="p-4 text-slate-300">{u.status ?? '-'}</td>
                      <td className="p-4">
                        {u.verified ? (
                          <span className="text-green-400">Sim</span>
                        ) : (
                          <span className="text-slate-500">Não</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-primary-400 transition hover:bg-slate-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Gerir
                        </button>
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

      {editId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeEdit}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 p-4">
              <h2 className="text-lg font-semibold text-white">Gerir utilizador</h2>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded p-2 text-slate-400 hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadDetail ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <div className="space-y-3 p-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Email (só leitura)</p>
                  <p className="text-white">{userEmail || '—'}</p>
                </div>
                {userCreated && (
                  <p className="text-xs text-slate-500">
                    Criado:{' '}
                    {new Date(userCreated).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}

                <div>
                  <label className="mb-1 block text-xs text-slate-500">Nome completo</label>
                  <input
                    className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Primeiro nome</label>
                    <input
                      className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                      value={form.first_name}
                      onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Apelido</label>
                    <input
                      className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                      value={form.last_name}
                      onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Telefone</label>
                  <input
                    className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-500">Função (role no PocketBase)</label>
                  <select
                    className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  >
                    {!ROLE_CHOICES.some((o) => o.value === form.role) && form.role && (
                      <option value={form.role}>Manter valor atual: {form.role}</option>
                    )}
                    {ROLE_CHOICES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label} ({o.value})
                      </option>
                    ))}
                  </select>
                  {!currentRoleInList && form.role && (
                    <p className="mt-1 text-xs text-amber-400/90">
                      Função pouco comum no sistema. Escolhe um valor da lista para normalizar, se fizer sentido.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-500">Estado da conta</label>
                  <select
                    className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {!['active', 'inactive'].includes(form.status) && form.status && (
                      <option value={form.status}>Manter: {form.status}</option>
                    )}
                    {STATUS_CHOICES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-slate-200">
                  <input
                    type="checkbox"
                    className="rounded border-slate-500"
                    checked={form.verified}
                    onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))}
                  />
                  Email verificado
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-slate-200">
                  <input
                    type="checkbox"
                    className="rounded border-slate-500"
                    checked={form.document_verified}
                    onChange={(e) => setForm((f) => ({ ...f, document_verified: e.target.checked }))}
                  />
                  Documento de identidade verificado
                </label>

                <div className="flex justify-end gap-2 border-t border-slate-700 pt-4">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving || loadDetail}
                    className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-500 disabled:opacity-50"
                  >
                    {saving ? 'A guardar…' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
