'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageSquare, Search, SlidersHorizontal } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import type { Message } from '@/lib/types'
import MessageThread from '@/components/MessageThread'
import { formatRelativeTime } from '@/utils/format'
import { DEFAULT_INTERNAL_MESSAGES_NOTICE } from '@/lib/internal-messages-settings.mjs'

interface ConversationRow {
  otherUserId: string
  otherUserName: string
  otherUserAvatar?: string
  lastMessage: Message
  unread: boolean
}

interface PublicInternalMessagesSettings {
  enabled: boolean
  notice: string
}

export default function MensagensClient() {
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''
  const withUserId = searchParams.get('with')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOther, setSelectedOther] = useState<{
    otherUserId: string
    otherUserName?: string
    otherUserAvatar?: string
  } | null>(null)
  const [messagesSettings, setMessagesSettings] = useState<PublicInternalMessagesSettings>({
    enabled: true,
    notice: '',
  })

  const loadMessages = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      const res = await fetch('/api/messages', { credentials: 'include' })
      if (!res.ok) throw new Error('Não foi possível carregar suas mensagens.')
      const list = (await res.json()) as Message[]
      setMessages(list)
    } catch (e) {
      console.error('Error loading messages:', e)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 10000)
    return () => clearInterval(interval)
  }, [loadMessages])

  useEffect(() => {
    let active = true

    fetch('/api/internal-messages-settings', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erro ao carregar configuração')
        const data = (await res.json()) as Partial<PublicInternalMessagesSettings>
        if (!active) return
        const enabled = data.enabled !== false
        const notice =
          typeof data.notice === 'string' && data.notice.trim()
            ? data.notice.trim()
            : enabled
              ? ''
              : DEFAULT_INTERNAL_MESSAGES_NOTICE
        setMessagesSettings({ enabled, notice })
      })
      .catch(() => {
        if (!active) return
        setMessagesSettings({ enabled: true, notice: '' })
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (withUserId && userId && withUserId !== userId) {
      setSelectedOther({ otherUserId: withUserId })
    }
  }, [withUserId, userId])

  const conversations: ConversationRow[] = (() => {
    const byOther: Record<string, { last: Message; unread: boolean }> = {}
    for (const msg of messages) {
      const sId = msg.sender_id ?? msg.sender
      const rId = msg.recipient_id ?? msg.recipient
      if (!sId || !rId) continue
      const otherId = sId === userId ? rId : sId
      const existing = byOther[otherId]
      const msgTime = new Date(msg.created_at).getTime()
      const lastTime = existing ? new Date(existing.last.created_at).getTime() : 0
      const isUnread = rId === userId && !msg.read
      if (!existing || msgTime > lastTime) {
        byOther[otherId] = {
          last: msg,
          unread: existing?.unread || isUnread,
        }
      } else if (isUnread) {
        byOther[otherId].unread = true
      }
    }
    return Object.entries(byOther).map(([otherUserId, { last, unread }]) => {
      const isSender = (last.sender_id ?? last.sender) === userId
      const otherExpand = isSender ? last.expand?.recipient : last.expand?.sender
      const otherUserName =
        otherExpand?.name ||
        (otherExpand as { email?: string })?.email ||
        `Usuário ${otherUserId.slice(0, 8)}`
      const otherUserAvatar = otherExpand?.avatar
      return {
        otherUserId,
        otherUserName,
        otherUserAvatar,
        lastMessage: last,
        unread,
      }
    })
  })().sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime())

  const filtered = searchQuery.trim()
    ? conversations.filter((c) =>
        c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations

  if (selectedOther) {
    return (
      <div className="mx-auto max-w-5xl">
        <MessageThread
          otherUserId={selectedOther.otherUserId}
          otherUserName={selectedOther.otherUserName}
          otherUserAvatar={selectedOther.otherUserAvatar}
          messagesEnabled={messagesSettings.enabled}
          messagesDisabledNotice={messagesSettings.notice}
          onBack={() => setSelectedOther(null)}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-400">Central de contato</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mensagens</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Converse com seus contatos em um só lugar.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <MessageSquare className="h-4 w-4" />
          {conversations.length} {conversations.length === 1 ? 'conversa' : 'conversas'}
        </div>
      </div>
      {!messagesSettings.enabled && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {messagesSettings.notice || DEFAULT_INTERNAL_MESSAGES_NOTICE}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800/70 dark:shadow-slate-950/20">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700/80">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Suas conversas</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">As mais recentes aparecem primeiro</p>
          </div>
          <SlidersHorizontal className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
        </div>
        <div className="border-b border-slate-200 p-4 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar conversas"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 placeholder-slate-500 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-600 dark:bg-slate-900/70 dark:text-white"
            />
          </div>
        </div>
        <div className="max-h-[65vh] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-700/50">
          {loading ? (
            <div className="p-8 text-center text-slate-600 dark:text-slate-400">Carregando conversas...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto mb-4 h-16 w-16 text-slate-400 dark:text-slate-600" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
              </p>
            </div>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.otherUserId}
                type="button"
                onClick={() =>
                  setSelectedOther({
                    otherUserId: conv.otherUserId,
                    otherUserName: conv.otherUserName,
                    otherUserAvatar: conv.otherUserAvatar,
                  })
                }
                className={`flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:hover:bg-slate-700/40 ${
                  conv.unread ? 'bg-primary-500/10' : ''
                }`}
              >
                {conv.otherUserAvatar ? (
                  <img
                    src={conv.otherUserAvatar}
                    alt={conv.otherUserName}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {conv.otherUserName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                    className={`truncate font-semibold ${
                        conv.unread ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {conv.otherUserName}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {formatRelativeTime(conv.lastMessage.created_at)}
                    </span>
                  </div>
                  <p
                    className={`mt-1 truncate text-sm ${
                      conv.unread ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {conv.lastMessage.content}
                  </p>
                </div>
                {conv.unread && (
                  <div className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
