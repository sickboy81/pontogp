'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const STORAGE_KEY = 'cerejavip_announcement_dismissed'

type Target = 'all' | 'guests' | 'logged_in' | 'advertiser'

export default function AnnouncementBar() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const [data, setData] = useState<{ enabled: boolean; message: string; target: Target } | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [isAdvertiser, setIsAdvertiser] = useState(false)

  useEffect(() => {
    fetch('/api/announcement', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d ?? { enabled: false, message: '', target: 'all' }))
      .catch(() => setData({ enabled: false, message: '', target: 'all' }))
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
    if (typeof window === 'undefined') return
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored === '1') setDismissed(true)
    } catch {
      // ignore
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
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
    <div className="relative border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center text-sm text-amber-100">
      <p className="pr-8">{data.message}</p>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-amber-300 hover:bg-amber-500/20 hover:text-white"
        aria-label="Fechar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
