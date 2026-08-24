'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/types'
import { getPb } from '@/lib/pb'
import { setAuthCookie, clearAuthCookie } from '@/lib/auth-cookie'
import { isAdminRole } from '@/lib/auth-roles'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
    register: (email: string, password: string, firstName?: string, lastName?: string, role?: string, details?: { fullName?: string; displayName?: string; age?: number }) => Promise<void>
  refresh: () => Promise<void>
}

export function getLoginErrorMessage(error: unknown): string {
  const err = error as { status?: number; response?: { message?: string } } | null
  const status = err?.status

  if (status === 400 || status === 401) {
    return 'Email ou senha incorretos. Confira seus dados e tente novamente.'
  }
  if (status === 403) {
    return 'Confirme seu email antes de entrar. Se não recebeu a mensagem, solicite um novo email de confirmação.'
  }
  if (status === 429) {
    return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
  }
  if (status === 0 || !status) {
    return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
  }

  return 'Não foi possível entrar agora. Tente novamente em instantes.'
}

function mapPbUser(pbUser: Record<string, unknown>): User {
  const name = (pbUser.name as string) || ''
  const parts = name.split(' ')
  return {
    id: pbUser.id as string,
    email: pbUser.email as string,
    first_name: (pbUser.first_name as string) || parts[0] || '',
    last_name: (pbUser.last_name as string) || parts.slice(1).join(' ') || '',
    phone: pbUser.phone as string | undefined,
    role: (pbUser.role as string) || 'user',
    status: (pbUser.verified ? 'active' : 'inactive') as string,
    avatar: pbUser.avatar ? getPb().files.getURL(pbUser as any, pbUser.avatar as string) : undefined,
    verified: pbUser.verified as boolean | undefined,
    document_verified: pbUser.document_verified as boolean | undefined,
    name,
    full_name: (pbUser.full_name as string) || undefined,
    display_name: (pbUser.display_name as string) || name || undefined,
    age: typeof pbUser.age === 'number' ? pbUser.age : Number(pbUser.age) || undefined,
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const pb = getPb()
        const normalizedEmail = email.toLowerCase().trim()
        const authData = await pb.collection('users').authWithPassword(normalizedEmail, password)
        const user = mapPbUser(authData.record as Record<string, unknown>)
        set({ user, token: authData.token, isAuthenticated: true })
        setAuthCookie(authData.token)
        // O alerta nativo do PocketBase não expõe IP/data no template; o endpoint
        // customizado envia esses dados reais depois que a sessão foi estabelecida.
        await fetch('/api/auth/login-alert', { method: 'POST', credentials: 'include' }).catch(() => {})
      },

      logout: async () => {
        try {
          getPb().authStore.clear()
        } catch {}
        clearAuthCookie()
        set({ user: null, token: null, isAuthenticated: false })
      },

      register: async (
        email: string,
        password: string,
        firstName?: string,
        lastName?: string,
        role: string = 'user',
        details?: { fullName?: string; displayName?: string; age?: number }
      ) => {
        const pb = getPb()
        const normalizedEmail = email.toLowerCase().trim()
        const safeRole = isAdminRole(role) ? 'user' : role
        const data = {
          email: normalizedEmail,
          emailVisibility: true,
          password,
          passwordConfirm: password,
          name: details?.displayName?.trim() || [firstName, lastName].filter(Boolean).join(' ').trim(),
          full_name: details?.fullName?.trim() || [firstName, lastName].filter(Boolean).join(' ').trim(),
          display_name: details?.displayName?.trim() || [firstName, lastName].filter(Boolean).join(' ').trim(),
          age: details?.age,
          first_name: firstName,
          last_name: lastName,
          verified: false,
          document_verified: false,
          role: safeRole,
          status: 'active',
        }
        await pb.collection('users').create(data)
        try {
          await pb.collection('users').requestVerification(normalizedEmail)
        } catch {}
      },

      refresh: async () => {
        const pb = getPb()
        try {
          if (pb.authStore.isValid) {
            await pb.collection('users').authRefresh()
            const model = pb.authStore.model
            if (model) {
              const user = mapPbUser(model as Record<string, unknown>)
              set({ user, token: pb.authStore.token, isAuthenticated: true })
              if (pb.authStore.token) setAuthCookie(pb.authStore.token)
            }
          } else {
            clearAuthCookie()
            set({ user: null, token: null, isAuthenticated: false })
          }
        } catch (e: unknown) {
          const err = e as { status?: number; message?: string }
          if (err?.status === 0 && err?.message?.includes('autocancelled')) return
          pb.authStore.clear()
          clearAuthCookie()
          set({ user: null, token: null, isAuthenticated: false })
        }
      },
    }),
    { name: 'auth-storage-pb' }
  )
)

export { isAdminRole } from '@/lib/auth-roles'
