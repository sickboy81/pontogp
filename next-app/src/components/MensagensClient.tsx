'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageSquare, Search } from 'lucide-react'
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
      <div className="h-[calc(100vh-12rem)] min-h-[400px]">
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
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Mensagens</h1>
      {!messagesSettings.enabled && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {messagesSettings.notice || DEFAULT_INTERNAL_MESSAGES_NOTICE}
        </div>
      )}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        <div className="border-b border-slate-700 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 py-2 pl-10 pr-4 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="divide-y divide-slate-700/50 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Carregando conversas...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto mb-4 h-16 w-16 text-slate-600" />
              <p className="text-slate-400">
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
                className={`flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-700/30 ${
                  conv.unread ? 'bg-slate-700/20' : ''
                }`}
              >
                {conv.otherUserAvatar ? (
                  <img
                    src={conv.otherUserAvatar}
                    alt={conv.otherUserName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-lg font-semibold text-slate-300">
                    {conv.otherUserName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-medium truncate ${
                        conv.unread ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {conv.otherUserName}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {formatRelativeTime(conv.lastMessage.created_at)}
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 truncate text-sm ${
                      conv.unread ? 'font-medium text-white' : 'text-slate-400'
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
