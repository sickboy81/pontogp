'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, ArrowLeft, Check, CheckCheck, Ban, ShieldOff, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { getPb } from '@/lib/pb'
import type { Message } from '@/lib/types'
import { formatRelativeTime } from '@/utils/format'
import toast from 'react-hot-toast'

interface MessageThreadProps {
  otherUserId: string
  otherUserName?: string
  otherUserAvatar?: string
  messagesEnabled?: boolean
  messagesDisabledNotice?: string
  onBack: () => void
}

export default function MessageThread({
  otherUserId,
  otherUserName,
  otherUserAvatar,
  messagesEnabled = true,
  messagesDisabledNotice = '',
  onBack,
}: MessageThreadProps) {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
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
      if (!res.ok) throw new Error('Não foi possível carregar esta conversa.')
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
      setMessages([])
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

  useEffect(() => {
    if (!userId || !otherUserId) return
    const pb = getPb()
    let active = true
    const onMessageChange = (event: { record?: Record<string, unknown> }) => {
      const record = event.record || {}
      const sender = String(record.sender_id || record.sender || '')
      const recipient = String(record.recipient_id || record.recipient || '')
      const belongsToConversation =
        (sender === userId && recipient === otherUserId) ||
        (sender === otherUserId && recipient === userId)
      if (active && belongsToConversation) void loadConversation()
    }
    void pb.collection('messages').subscribe('*', onMessageChange).catch(() => undefined)
    return () => {
      active = false
      void pb.collection('messages').unsubscribe('*').catch(() => undefined)
    }
  }, [userId, otherUserId, loadConversation])

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
    if (!messagesEnabled) {
      if (messagesDisabledNotice) toast.error(messagesDisabledNotice)
      return
    }
    if (!newMessage.trim() || sending) return
    try {
      setSending(true)
      setSendError('')
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
        const message = err?.error || 'Erro ao enviar'
        setSendError(message)
        toast.error(message)
      }
    } catch (e) {
      console.error('Error sending message:', e)
      setSendError('Não foi possível enviar a mensagem. Tente novamente.')
      toast.error('Não foi possível enviar a mensagem. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  const displayName = otherUserName || 'Usuário'
  const sendDisabled = sending || blocked || !messagesEnabled
  const inputPlaceholder = blocked
    ? 'Conversa bloqueada'
    : !messagesEnabled
      ? messagesDisabledNotice || 'Mensagens temporariamente indisponíveis'
      : 'Digite sua mensagem...'

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] flex-col rounded-2xl border border-slate-700 bg-slate-800/70 shadow-xl shadow-slate-950/20">
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
    <div className="flex min-h-[calc(100vh-12rem)] flex-col rounded-2xl border border-slate-700 bg-slate-800/70 shadow-xl shadow-slate-950/20">
      <div className="flex items-center gap-3 border-b border-slate-700/80 bg-slate-800/80 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {otherUserAvatar ? (
          <img
            src={otherUserAvatar}
            alt={displayName}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-700"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-lg font-semibold text-slate-300">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <span className="block truncate font-semibold text-white">{displayName}</span>
          <span className="text-xs text-slate-400">Conversa privada</span>
        </div>
        <button
          type="button"
          onClick={handleBlockToggle}
          disabled={blockLoading}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-slate-400 transition hover:bg-slate-700 hover:text-amber-400 disabled:opacity-50 sm:px-3"
          title={blocked ? 'Desbloquear conversa' : 'Bloquear conversa'}
        >
          {blocked ? <ShieldOff className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          <span className="hidden sm:inline">{blocked ? 'Desbloquear' : 'Bloquear'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-900/20 p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-400">
              <MessageCircle className="h-6 w-6" />
            </div>
            <p className="font-medium text-slate-200">Nenhuma mensagem ainda</p>
            <p className="mt-1 max-w-xs text-sm text-slate-400">Envie uma mensagem para iniciar esta conversa.</p>
          </div>
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
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-950/20'
                        : 'border border-slate-600/80 bg-slate-700 text-slate-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs opacity-80">
                      {isMe && (msg.read ? <CheckCheck aria-label="Lida" className="h-3.5 w-3" /> : <Check aria-label="Enviada" className="h-3.5 w-3" />)}
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
      {!messagesEnabled && (
        <p className="border-t border-slate-700 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
          {messagesDisabledNotice || 'As mensagens internas estão temporariamente indisponíveis.'}
        </p>
      )}
      {sendError && (
        <div role="alert" className="flex items-center justify-between gap-3 border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          <span>{sendError}</span>
          <button type="button" onClick={() => { setSendError(''); void handleSend({ preventDefault: () => undefined } as React.FormEvent) }} className="font-semibold underline hover:text-white">Tentar novamente</button>
        </div>
      )}
      <form onSubmit={handleSend} className="border-t border-slate-700/80 bg-slate-800/80 p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={inputPlaceholder}
            aria-label="Mensagem"
            className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-3 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
            disabled={sendDisabled}
          />
          <button
            type="submit"
            disabled={sendDisabled || !newMessage.trim()}
            aria-label="Enviar mensagem"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 font-medium text-white transition hover:bg-primary-500 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
