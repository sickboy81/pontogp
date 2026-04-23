'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { setAuthCookie, clearAuthCookie } from '@/lib/auth-cookie'
import { getPb } from '@/lib/pb'

/** Sincroniza o token do Zustand com o cookie e com o cliente PocketBase. */
export default function AuthCookieSync() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated && token) {
      setAuthCookie(token)
      try {
        const pb = getPb()
        if (user && typeof pb.authStore.save === 'function') {
          pb.authStore.save(token, { id: user.id, email: user.email, name: user.name } as unknown as Record<string, unknown>)
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

  return null
}
