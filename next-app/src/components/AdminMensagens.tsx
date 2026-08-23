'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, MessageCircle, CheckCheck } from 'lucide-react'
import type { Message } from '@/lib/types'

function senderName(m: Message) {
  return m.expand?.sender?.name || m.expand?.sender?.email || m.sender
}

function recipientName(m: Message) {
  return m.expand?.recipient?.name || m.expand?.recipient?.email || m.recipient
}

function threadKey(a: string, b: string) {
  return a < b ? `${a}::${b}` : `${b}::${a}`
}

type Thread = {
  key: string
  userA: string
  userB: string
  nameA: string
  nameB: string
  lastMessage: Message
  unreadInThread: number
  /** ids ordenados alfabeticamente (para alinhar bolhas) */
  leftId: string
  rightId: string
}

function threadIsForAdmin(t: Thread) {
  return t.lastMessage.expand?.sender?.role === 'admin' || t.lastMessage.expand?.recipient?.role === 'admin'
}

function displayNameForUser(messages: Message[], userId: string) {
  for (const m of messages) {
    if ((m.sender_id ?? m.sender) === userId) {
      const n = senderName(m)
      if (n && n !== userId) return n
    }
    if ((m.recipient_id ?? m.recipient) === userId) {
      const n = recipientName(m)
      if (n && n !== userId) return n
    }
  }
  return `Id ${userId.slice(0, 8)}…`
}

function buildThreadsFromMessages(rows: Message[]): Thread[] {
  const map = new Map<string, { messages: Message[] }>()
  for (const m of rows) {
    const s = m.sender_id ?? m.sender
    const r = m.recipient_id ?? m.recipient
    if (!s || !r) continue
    const k = threadKey(s, r)
    const g = map.get(k) || { messages: [] }
    g.messages.push(m)
    map.set(k, g)
  }
  const out: Thread[] = []
  for (const [, g] of map) {
    const ms = g.messages
    if (ms.length === 0) continue
    const a = (ms[0].sender_id ?? ms[0].sender) as string
    const b = (ms[0].recipient_id ?? ms[0].recipient) as string
    const last = ms.reduce(
      (p, c) => (new Date(c.created_at) > new Date(p.created_at) ? c : p),
      ms[0]
    )
    const unreadInThread = ms.filter((m) => !m.read).length
    const nameA = displayNameForUser(ms, a)
    const nameB = displayNameForUser(ms, b)
    const leftId = a < b ? a : b
    const rightId = a < b ? b : a
    out.push({
      key: threadKey(a, b),
      userA: a,
      userB: b,
      nameA,
      nameB,
      lastMessage: last,
      unreadInThread,
      leftId,
      rightId,
    })
  }
  return out.sort(
    (x, y) => new Date(y.lastMessage.created_at).getTime() - new Date(x.lastMessage.created_at).getTime()
  )
}

function formatListTime(d: string) {
  if (!d) return '-'
  try {
    const date = new Date(d)
    const now = new Date()
    if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
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

function formatMsgTime(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const THREAD_FETCH = 500

export default function AdminMensagens() {
  const [rawMessages, setRawMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread_thread'>('all')
  const [audience, setAudience] = useState<'admin' | 'users'>('admin')
  const [selected, setSelected] = useState<Thread | null>(null)
  const [threadMsgs, setThreadMsgs] = useState<Message[]>([])
  const [threadLoading, setThreadLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const loadRaw = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/messages?page=1&perPage=${THREAD_FETCH}&read=all`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error('load')
      const data = await res.json()
      setRawMessages(data.items || [])
    } catch {
      setRawMessages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRaw()
  }, [loadRaw])

  const threads = useMemo(() => {
    return buildThreadsFromMessages(rawMessages)
  }, [rawMessages])

  const visibleThreads = useMemo(() => {
    const byAudience = threads.filter((t) => (audience === 'admin' ? threadIsForAdmin(t) : !threadIsForAdmin(t)))
    return filter === 'unread_thread' ? byAudience.filter((t) => t.unreadInThread > 0) : byAudience
  }, [threads, filter, audience])

  const openThread = useCallback(
    async (t: Thread) => {
      setSelected(t)
      setThreadLoading(true)
      setThreadMsgs([])
      try {
        const res = await fetch(
          `/api/admin/messages/conversation?userA=${encodeURIComponent(t.userA)}&userB=${encodeURIComponent(
            t.userB
          )}`,
          { credentials: 'include' }
        )
        if (!res.ok) throw new Error('conv')
        const data = (await res.json()) as { items: Message[] }
        const items = data.items || []
        setThreadMsgs(items)
        const unreadIds = threadIsForAdmin(t) ? items.filter((message) => !message.read).map((message) => message.id) : []
        if (unreadIds.length > 0) {
          await Promise.all(unreadIds.map((id) => fetch(`/api/admin/messages/${encodeURIComponent(id)}`, { method: 'PATCH', credentials: 'include' })))
          setRawMessages((current) => current.map((message) => unreadIds.includes(message.id) ? { ...message, read: true } : message))
          setThreadMsgs((current) => current.map((message) => unreadIds.includes(message.id) ? { ...message, read: true } : message))
        }
      } catch {
        setThreadMsgs([])
      } finally {
        setThreadLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (threadMsgs.length > 0 && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [threadMsgs, selected?.key])

  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
      <h1 className="mb-1 text-2xl font-bold text-white">Chat interno</h1>
      <p className="mb-4 text-sm text-slate-500">
        Mensagens trocadas entre utilizadores. Apenas mensagens dirigidas ao admin entram na fila e são
        marcadas como lidas ao abrir; conversas entre usuários ficam fora da contagem administrativa.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setAudience('admin'); setSelected(null); setThreadMsgs([]) }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            audience === 'admin' ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
          }`}
        >
          Mensagens para o admin
        </button>
        <button
          type="button"
          onClick={() => { setAudience('users'); setSelected(null); setThreadMsgs([]) }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            audience === 'users' ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
          }`}
        >
          Conversas entre usuários
        </button>
        <span className="basis-full" />
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
          }`}
        >
          Todas as conversas
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread_thread')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'unread_thread'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
          }`}
        >
          Com mensagens não lidas
        </button>
        <button
          type="button"
          onClick={() => void loadRaw()}
          className="ml-auto rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando conversas…</span>
        </div>
      ) : (
        <div className="grid min-h-[480px] gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50">
            <div className="border-b border-slate-700 px-3 py-2 text-xs text-slate-500">
              {visibleThreads.length} conversa{visibleThreads.length !== 1 ? 's' : ''} nesta aba (últimas {THREAD_FETCH} mensagens)
            </div>
            <div className="max-h-[min(70vh,720px)] overflow-y-auto">
              {visibleThreads.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
                  <MessageCircle className="h-10 w-10 opacity-50" />
                  <p className="text-sm">Nenhuma conversa neste filtro</p>
                </div>
              ) : (
                visibleThreads.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => void openThread(t)}
                    className={`flex w-full flex-col gap-0.5 border-b border-slate-700/50 px-3 py-3 text-left text-sm transition hover:bg-slate-700/40 ${
                      selected?.key === t.key ? 'bg-primary-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 font-medium text-white">
                        {t.nameA} <span className="text-slate-500">↔</span> {t.nameB}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {formatListTime(t.lastMessage.created_at)}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-slate-400">
                      {senderName(t.lastMessage)}: {t.lastMessage.content}
                    </p>
                    {t.unreadInThread > 0 && (
                      <span className="mt-1 w-fit rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300">
                        {t.unreadInThread} não lida{t.unreadInThread > 1 ? 's' : ''} (no dest.)
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex min-h-[480px] flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50">
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-slate-500">
                <MessageCircle className="h-12 w-12 opacity-40" />
                <p>Escolha uma conversa à esquerda</p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-700 px-4 py-3">
                  <h2 className="text-sm font-semibold text-white">
                    {selected.nameA} <span className="font-normal text-slate-500">e</span> {selected.nameB}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Utilizador A: {selected.userA.slice(0, 12)}… · Utilizador B: {selected.userB.slice(0, 12)}…
                  </p>
                </div>
                {threadLoading ? (
                  <div className="flex flex-1 items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    A carregar mensagens…
                  </div>
                ) : (
                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {threadMsgs.length === 0 ? (
                      <p className="text-center text-slate-500">Sem mensagens</p>
                    ) : (
                      threadMsgs.map((msg) => {
                        const sid = msg.sender_id ?? msg.sender
                        const isLeft = sid === selected.leftId
                        return (
                          <div key={msg.id} className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
                            <div
                              className={`max-w-[88%] rounded-2xl px-4 py-2 ${
                                isLeft
                                  ? 'bg-slate-700 text-slate-100'
                                  : 'bg-primary-600/90 text-white'
                              }`}
                            >
                              <p className="text-xs font-medium opacity-80">{senderName(msg)}</p>
                              <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                              <div className="mt-1 flex flex-wrap items-center justify-end gap-x-1.5 text-xs opacity-80">
                                <span>{formatMsgTime(msg.created_at)}</span>
                                {msg.read ? (
                                  <span className="inline-flex items-center gap-0.5" title="Destinatário abriu a mensagem">
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Lida
                                  </span>
                                ) : (
                                  <span className="text-amber-200/90">Pendente (dest.)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={endRef} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
