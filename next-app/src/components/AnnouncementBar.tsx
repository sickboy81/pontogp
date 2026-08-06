'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const STORAGE_KEY = 'cerejavip_announcement_dismissed'

type Target = 'all' | 'guests' | 'logged_in' | 'advertiser'
type Announcement = {
  enabled: boolean
  message: string
  target: Target
  background_color: string
  text_color: string
  display_mode: 'static' | 'marquee'
  speed: number
}

const DEFAULT_ANNOUNCEMENT: Announcement = {
  enabled: false,
  message: '',
  target: 'all',
  background_color: '#422006',
  text_color: '#fef3c7',
  display_mode: 'static',
  speed: 60,
}

export default function AnnouncementBar() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const [data, setData] = useState<Announcement | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [isAdvertiser, setIsAdvertiser] = useState(false)

  useEffect(() => {
    fetch('/api/announcement')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d ? { ...DEFAULT_ANNOUNCEMENT, ...d } : DEFAULT_ANNOUNCEMENT))
      .catch(() => setData(DEFAULT_ANNOUNCEMENT))
  }, [])

  useEffect(() => {
    if (!user || !token) {
      setIsAdvertiser(false)
      return
    }
    if (user.role === 'advertiser' || user.role === '1') {
      setIsAdvertiser(true)
      return
    }
    fetch('/api/profiles/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setIsAdvertiser(!!p && (Array.isArray(p) ? p.length > 0 : !!p.id)))
      .catch(() => setIsAdvertiser(false))
  }, [user, token])

  useEffect(() => {
    if (typeof window === 'undefined' || !data?.message) return
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      setDismissed(stored === data.message)
    } catch {
      // ignore
    }
  }, [data?.message])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(STORAGE_KEY, data?.message ?? '')
    } catch {
      // ignore
    }
  }

  const showByTarget =
    data?.target === 'all' ||
    (data?.target === 'guests' && !user) ||
    (data?.target === 'logged_in' && !!user) ||
    (data?.target === 'advertiser' && isAdvertiser)

  if (!data?.enabled || !data.message.trim() || dismissed || !showByTarget) return null

  return (
    <div
      className="relative overflow-hidden border-b px-4 py-2.5 text-center text-sm"
      style={{ backgroundColor: data.background_color, color: data.text_color, borderColor: `${data.text_color}55` }}
    >
      <div className={data.display_mode === 'marquee' ? 'announcement-marquee pr-8' : 'pr-8'} style={data.display_mode === 'marquee' ? { animationDuration: `${Math.max(8, 1200 / data.speed)}s` } : undefined}>
        <p>{data.message}</p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 opacity-80 hover:bg-black/20 hover:opacity-100"
        aria-label="Fechar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
