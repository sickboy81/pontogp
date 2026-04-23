'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore, isAdminRole } from '@/store/auth'

const ALLOWED_PREFIXES = [
  '/manutencao',
  '/admin',
  '/login',
  '/esqueci-senha',
  '/redefinir-senha',
  '/verificar-email',
  '/verificar-email-pendente',
]

function isAllowed(pathname: string): boolean {
  return ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

/** Nunca use `return null` aqui: em alguns dispositivos o ecrã ficava em branco até vários F5. */
function LoadingShell({ text = 'Carregando…' }: { text?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      <p className="mt-4 text-center text-sm text-slate-400">{text}</p>
    </div>
  )
}

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [authHydrated, setAuthHydrated] = useState(false)
  const [maintenance, setMaintenance] = useState<{ enabled: boolean } | null>(null)

  useEffect(() => {
    const p = useAuthStore.persist
    if (p.hasHydrated()) setAuthHydrated(true)
    return p.onFinishHydration(() => setAuthHydrated(true))
  }, [])

  /** Se o persist nunca concluir (ex.: localStorage), não deixar o ecrã de carregamento infinito. */
  useEffect(() => {
    if (!maintenance?.enabled) return
    if (isAllowed(pathname)) return
    if (authHydrated) return
    const t = setTimeout(() => setAuthHydrated(true), 2500)
    return () => clearTimeout(t)
  }, [maintenance, pathname, authHydrated])

  useEffect(() => {
    fetch('/api/maintenance', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setMaintenance(d))
      .catch(() => setMaintenance({ enabled: false }))
  }, [])

  useLayoutEffect(() => {
    if (!maintenance?.enabled) return
    if (isAllowed(pathname)) return
    if (!authHydrated) return
    if (isAdminRole(user?.role)) return
    router.replace('/manutencao')
  }, [maintenance, pathname, user?.role, authHydrated, router])

  if (!maintenance) {
    return <>{children}</>
  }
  if (!maintenance.enabled) {
    return <>{children}</>
  }
  if (isAllowed(pathname)) {
    return <>{children}</>
  }
  if (!authHydrated) {
    return <LoadingShell text="A verificar sessão e manutenção…" />
  }
  if (isAdminRole(user?.role)) {
    return <>{children}</>
  }
  return <LoadingShell text="Redirecionando…" />
}
