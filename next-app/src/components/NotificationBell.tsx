'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

export default function NotificationBell() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }
    fetch('/api/notifications?perPage=1&unreadOnly=true', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUnreadCount(d?.unreadCount ?? 0))
      .catch(() => setUnreadCount(0))
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  return (
    <Link
      href="/notificacoes"
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
      aria-label={unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Notificações'}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
