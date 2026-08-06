'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, Loader2, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface ContactRow {
  id: string
  name?: string
  email?: string
  subject?: string
  message?: string
  read?: boolean
  created?: string
  created_at?: string
  date_created?: string
  ip_address?: string
}

export default function AdminContatos() {
  const [items, setItems] = useState<ContactRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all')
  const [selected, setSelected] = useState<ContactRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const readParam = filter === 'all' ? '' : filter === 'read' ? 'true' : 'false'
      const qs = readParam ? `?page=1&perPage=100&read=${readParam}` : '?page=1&perPage=100'
      const res = await fetch(`/api/admin/contacts${qs}`, { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Não foi possível carregar as mensagens.')
      setItems(((data as { items?: ContactRow[] }).items || []) as ContactRow[])
    } catch (cause) {
      setItems([])
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as mensagens.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const markRead = async (id: string, value: boolean) => {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: !value }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error((json as { error?: string }).error || 'Erro ao atualizar contato')
      return
    }
    load()
  }

  const remove = async (id: string) => {
    if (!window.confirm('Excluir mensagem de contato?')) return
    const res = await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE', credentials: 'include' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error((json as { error?: string }).error || 'Erro ao excluir contato')
      return
    }
    toast.success('Mensagem excluída')
    load()
  }

  const formatDate = (value?: string) => {
    if (!value) return '-'
    try {
      return new Date(value).toLocaleString('pt-BR')
    } catch {
      return value
    }
  }

  const getContactDate = (contact: ContactRow) => contact.created || contact.created_at || contact.date_created

  return (
    <div>
      <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Mensagens de contato</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'read' | 'unread')}
          className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          <option value="all">Todas</option>
          <option value="unread">Não lidas</option>
          <option value="read">Lidas</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
          {error}
          <button type="button" onClick={() => void load()} className="ml-3 underline hover:text-white">
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-700 bg-slate-800/50">
              <tr>
                <th className="p-4 text-slate-300">Data</th>
                <th className="p-4 text-slate-300">Nome</th>
                <th className="p-4 text-slate-300">E-mail</th>
                <th className="p-4 text-slate-300">Assunto</th>
                <th className="p-4 text-slate-300">Mensagem</th>
                <th className="p-4 text-slate-300">IP</th>
                <th className="p-4 text-slate-300">Status</th>
                <th className="p-4 text-slate-300">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhum contato encontrado.
                  </td>
                </tr>
              ) : items.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-800/30">
                  <td className="p-4 whitespace-nowrap text-slate-300">{formatDate(getContactDate(contact))}</td>
                  <td className="p-4 text-slate-300">{contact.name || '-'}</td>
                  <td className="p-4 text-slate-300">{contact.email || '-'}</td>
                  <td className="p-4 text-slate-300">{contact.subject || '-'}</td>
                  <td className="max-w-md truncate p-4 text-slate-300">{contact.message || '-'}</td>
                  <td className="whitespace-nowrap p-4 font-mono text-xs text-slate-400">{contact.ip_address || '-'}</td>
                  <td className="p-4">
                    <span className={contact.read ? 'text-green-400' : 'text-amber-400'}>
                      {contact.read ? 'Lida' : 'Não lida'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(contact)}
                        className="inline-flex items-center gap-1 rounded border border-primary-500/40 px-2 py-1 text-xs text-primary-200 hover:bg-primary-500/10"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Abrir
                      </button>
                      <button
                        type="button"
                        onClick={() => markRead(contact.id, !!contact.read)}
                        className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                      >
                        {contact.read ? 'Marcar não lida' : 'Marcar lida'}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(contact.id)}
                        className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                      >
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Mensagem de contato">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mensagem de contato</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{selected.subject || 'Sem assunto'}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <div><p className="text-xs uppercase tracking-wider text-slate-500">Data</p><p className="mt-1 text-slate-200">{formatDate(getContactDate(selected))}</p></div>
              <div><p className="text-xs uppercase tracking-wider text-slate-500">IP de origem</p><p className="mt-1 font-mono text-sm text-slate-200">{selected.ip_address || 'Não registrado'}</p></div>
              <div><p className="text-xs uppercase tracking-wider text-slate-500">Nome</p><p className="mt-1 text-slate-200">{selected.name || '-'}</p></div>
              <div><p className="text-xs uppercase tracking-wider text-slate-500">E-mail</p><p className="mt-1 break-all text-slate-200">{selected.email || '-'}</p></div>
            </div>
            <div className="border-t border-slate-800 px-6 py-5">
              <p className="text-xs uppercase tracking-wider text-slate-500">Mensagem</p>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-200">{selected.message || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
