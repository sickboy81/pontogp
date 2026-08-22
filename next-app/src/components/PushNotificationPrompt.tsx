'use client'

import { useEffect, useState } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function decodeKey(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  return Uint8Array.from(atob((value + padding).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))
}

export default function PushNotificationPrompt() {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    setSupported(Boolean(VAPID_PUBLIC_KEY && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window))
  }, [])
  if (!supported) return null
  const enable = async () => {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
      const registration = await navigator.serviceWorker.register('/push-sw.js', { scope: '/' })
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(VAPID_PUBLIC_KEY) })
      const res = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(subscription.toJSON()) })
      if (res.ok) setEnabled(true)
    } finally { setLoading(false) }
  }
  return <button type="button" onClick={enable} disabled={loading || enabled} className="inline-flex items-center gap-2 rounded-lg border border-primary-500/50 bg-primary-500/10 px-3 py-2 text-sm text-primary-200 hover:bg-primary-500/20 disabled:opacity-70">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : enabled ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}{enabled ? 'Notificações ativadas' : 'Ativar notificações'}</button>
}
