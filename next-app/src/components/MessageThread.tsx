'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, ArrowLeft, CheckCheck, Ban, ShieldOff } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import type { Message } from '@/lib/types'
import { formatRelativeTime } from '@/utils/format'
import toast from 'react-hot-toast'

interface MessageThreadProps {
  otherUserId: string
  otherUserName?: string
  otherUserAvatar?: string
  onBack: () => void
}

export default function MessageThread({
  otherUserId,
  otherUserName,
  otherUserAvatar,
  onBack,
}: MessageThreadProps) {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageId = messages.at(-1)?.id

  const loadConversation = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(
        `/api/messages/conversation?otherUserId=${encodeURIComponent(otherUserId)}`,
        { credentials: 'include' }
      )
      const list = (await res.json()) as Message[]
      setMessages(list)
      const unreadIds = list
        .filter((m) => (m.recipient_id ?? m.recipient) === userId && !m.read)
        .map((m) => m.id)
      if (unreadIds.length > 0) {
        await fetch('/api/messages/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ids: unreadIds }),
        })
      }
    } catch (e) {
      console.error('[MessageThread] Error loading conversation:', e)
    } finally {
      setLoading(false)
    }
  }, [userId, otherUserId])

  const loadBlockStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/messages/block?otherUserId=${encodeURIComponent(otherUserId)}`,
        { credentials: 'include' }
      )
      if (res.ok) {
        const data = (await res.json()) as { blocked?: boolean }
        setBlocked(data.blocked === true)
      }
    } catch {
      // ignore
    }
  }, [otherUserId])

  useEffect(() => {
    loadConversation()
    loadBlockStatus()
    const interval = setInterval(loadConversation, 5000)
    return () => clearInterval(interval)
  }, [loadConversation, loadBlockStatus])

  const handleBlockToggle = async () => {
    if (blockLoading) return
    setBlockLoading(true)
    try {
      const res = await fetch('/api/messages/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ otherUserId, block: !blocked }),
      })
      const data = (await res.json()) as { blocked?: boolean; error?: string }
      if (!res.ok) {
        toast.error(data.error || 'Erro ao atualizar bloqueio')
        return
      }
      setBlocked(data.blocked === true)
      toast.success(data.blocked ? 'Conversa bloqueada' : 'Conversa desbloqueada')
    } finally {
      setBlockLoading(false)
    }
  }

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, lastMessageId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    try {
      setSending(true)
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipient_id: otherUserId, content: newMessage.trim() }),
      })
      if (res.ok) {
        const sent = (await res.json()) as Message
        setMessages((prev) => [...prev, sent])
        setNewMessage('')
      } else {
        const err = (await res.json()) as { error?: string }
        toast.error(err?.error || 'Erro ao enviar')
      }
    } catch (e) {
      console.error('Error sending message:', e)
    } finally {
      setSending(false)
    }
  }

  const displayName = otherUserName || 'Usuário'

  if (loading) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-3 border-b border-slate-700 p-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-700" />
          <div className="h-4 flex-1 animate-pulse rounded bg-slate-700" />
        </div>
        <div className="flex flex-1 items-center justify-center p-8 text-slate-400">
          Carregando conversa...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-800/50">
      <div className="flex items-center gap-3 border-b border-slate-700 p-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {otherUserAvatar ? (
          <img
            src={otherUserAvatar}
            alt={displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-lg font-semibold text-slate-300">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-medium text-white">{displayName}</span>
        <button
          type="button"
          onClick={handleBlockToggle}
          disabled={blockLoading}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-700 hover:text-amber-400 disabled:opacity-50"
          title={blocked ? 'Desbloquear conversa' : 'Bloquear conversa'}
        >
          {blocked ? <ShieldOff className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          {blocked ? 'Desbloquear' : 'Bloquear'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-slate-400">Nenhuma mensagem ainda. Envie a primeira.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMe = (msg.sender_id ?? msg.sender) === userId
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isMe
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs opacity-80">
                      {isMe && (msg.read ? <CheckCheck className="h-3.5 w-3" /> : null)}
                      <span>{formatRelativeTime(msg.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {blocked && (
        <p className="border-t border-slate-700 px-4 py-2 text-center text-sm text-amber-400">
          Esta conversa está bloqueada. Você não pode enviar mensagens.
        </p>
      )}
      <form onSubmit={handleSend} className="border-t border-slate-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={blocked ? 'Conversa bloqueada' : 'Digite sua mensagem...'}
            className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-60"
            disabled={sending || blocked}
          />
          <button
            type="submit"
            disabled={sending || blocked || !newMessage.trim()}
            className="rounded-xl bg-primary-600 px-4 py-2.5 font-medium text-white transition hover:bg-primary-500 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
