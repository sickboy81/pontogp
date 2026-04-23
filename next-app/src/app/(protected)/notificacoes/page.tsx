'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, ArrowLeft, Loader2, Check } from 'lucide-react'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link?: string
  created: string
}

export default function NotificacoesPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/notifications?perPage=50', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setItems(d?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const markAsRead = async (id: string) => {
    setMarkingId(id)
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      }
    } finally {
      setMarkingId(null)
    }
  }

  const formatDate = (s: string) => {
    try {
      const d = new Date(s)
      const now = new Date()
      const diff = now.getTime() - d.getTime()
      if (diff < 60000) return 'Agora'
      if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} h atrás`
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    } catch {
      return s
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
        <Bell className="h-7 w-7 text-primary-500" />
        Notificações
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center text-slate-400">
          Nenhuma notificação.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 ${
                n.read ? 'border-slate-700 bg-slate-800/30' : 'border-primary-500/30 bg-primary-500/5'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {n.link ? (
                    <Link href={n.link} className="font-medium text-white hover:underline">
                      {n.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-white">{n.title}</span>
                  )}
                  <p className="mt-1 text-sm text-slate-300">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(n.created)}</p>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markAsRead(n.id)}
                    disabled={markingId === n.id}
                    className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50"
                    title="Marcar como lida"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
