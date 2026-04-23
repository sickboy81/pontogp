'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, MessageSquare, Eye, X } from 'lucide-react'
import type { Message } from '@/lib/types'

function senderLabel(m: Message) {
  return m.expand?.sender?.name || m.expand?.sender?.email || m.sender
}

function recipientLabel(m: Message) {
  return m.expand?.recipient?.name || m.expand?.recipient?.email || m.recipient
}

export default function AdminMensagens() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [openMessage, setOpenMessage] = useState<Message | null>(null)
  const perPage = 30

  useEffect(() => {
    loadMessages()
  }, [filter, page])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const readParam =
        filter === 'unread' ? 'false' : filter === 'read' ? 'true' : 'all'
      const res = await fetch(
        `/api/admin/messages?page=${page}&perPage=${perPage}&read=${readParam}`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error('Erro ao carregar mensagens')
      const data = await res.json()
      setMessages(data.items || [])
      setTotalItems(data.totalItems ?? 0)
    } catch {
      setMessages([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d: string) => {
    if (!d) return '-'
    try {
      const date = new Date(d)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return d
    }
  }

  const totalPages = Math.ceil(totalItems / perPage) || 1

  const openDetails = useCallback(
    async (m: Message) => {
      setOpenMessage(m)
      if (m.read) return
      try {
        const res = await fetch(`/api/admin/messages/${m.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ read: true }),
        })
        if (!res.ok) return
        const updated = (await res.json()) as Message
        setOpenMessage(updated)
        if (filter === 'unread') {
          setMessages((prev) => prev.filter((x) => x.id !== m.id))
          setTotalItems((n) => Math.max(0, n - 1))
        } else {
          setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...updated, read: true } : x)))
        }
      } catch {
        // mantém modal aberto para leitura
      }
    },
    [filter]
  )

  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-white">Mensagens do sistema</h1>
      <p className="mb-6 text-sm text-slate-500">
        Clique em <strong className="text-slate-400">Abrir</strong> (ou na linha) para ver a mensagem completa. Ao abrir, mensagens
        não lidas são marcadas como lidas.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
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
        <button
          onClick={() => setFilter('unread')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'unread'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
          }`}
        >
          Não lidas
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'read'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
          }`}
        >
          Lidas
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando mensagens...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-400">
          <MessageSquare className="h-16 w-16 opacity-50" />
          <p>Nenhuma mensagem encontrada</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/50">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-sm font-medium text-slate-400">Ação</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-400">De</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-400">Para</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-400">Conteúdo</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-400">Data</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr
                    key={m.id}
                    className="cursor-pointer border-b border-slate-700/50 last:border-0 transition hover:bg-slate-800/50"
                    onClick={() => openDetails(m)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDetails(m)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-primary-400 transition hover:border-primary-500/50 hover:bg-slate-700"
                      >
                        <Eye className="h-4 w-4" />
                        Abrir
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white">{senderLabel(m)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white">{recipientLabel(m)}</span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-300">{m.content}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(m.created_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs ${
                          m.read ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {m.read ? 'Lida' : 'Não lida'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white disabled:opacity-50 hover:bg-slate-600"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-400">
                Página {page} de {totalPages} ({totalItems} mensagens)
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white disabled:opacity-50 hover:bg-slate-600"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {openMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-msg-title"
          onClick={() => setOpenMessage(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 p-4">
              <h2 id="admin-msg-title" className="text-lg font-semibold text-white">
                Mensagem
              </h2>
              <button
                type="button"
                onClick={() => setOpenMessage(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">De</p>
                <p className="text-white">{senderLabel(openMessage)}</p>
                {openMessage.expand?.sender?.email && (
                  <p className="text-slate-500">{openMessage.expand.sender.email}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Para</p>
                <p className="text-white">{recipientLabel(openMessage)}</p>
                {openMessage.expand?.recipient?.email && (
                  <p className="text-slate-500">{openMessage.expand.recipient.email}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Data</p>
                <p className="text-slate-300">
                  {new Date(openMessage.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Conteúdo</p>
                <p className="whitespace-pre-wrap break-words text-slate-200">{openMessage.content || '—'}</p>
              </div>
              {openMessage.read && (
                <p className="text-xs text-emerald-400/90">Mensagem marcada como lida no sistema.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
