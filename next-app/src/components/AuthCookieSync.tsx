'use client'

import { useEffect } from 'react'
import type { RecordModel } from 'pocketbase'
import { useAuthStore } from '@/store/auth'
import { setAuthCookie, clearAuthCookie } from '@/lib/auth-cookie'
import { getPb } from '@/lib/pb'

/** Sincroniza o token do Zustand com o cookie e com o cliente PocketBase. */
export default function AuthCookieSync() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const sessionValidated = useAuthStore((s) => s.sessionValidated)
  const refresh = useAuthStore((s) => s.refresh)

  useEffect(() => {
    if (isAuthenticated && token) {
      setAuthCookie(token)
      try {
        const pb = getPb()
        if (user && typeof pb.authStore.save === 'function') {
          const displayName =
            (user.name && user.name.trim()) ||
            [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
            user.email
          const model = {
            id: user.id,
            collectionId: '',
            collectionName: 'users',
            email: user.email,
            name: displayName,
          } as RecordModel
          pb.authStore.save(token, model)
        }
      } catch {
        // ignore
      }
    } else {
      clearAuthCookie()
      try {
        getPb().authStore.clear()
      } catch {
        // ignore
      }
    }
  }, [isAuthenticated, token, user])

  useEffect(() => {
    if (isAuthenticated && token && !sessionValidated) void refresh()
  }, [isAuthenticated, token, sessionValidated, refresh])

  return null
}
