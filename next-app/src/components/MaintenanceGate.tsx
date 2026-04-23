'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore, isAdminRole } from '@/store/auth'

const ALLOWED_PREFIXES = [
  '/manutencao',
  '/admin',
  '/login',
  '/esqueci-senha',
  '/redefinir-senha',
  '/verificar-email',
]

function isAllowed(pathname: string): boolean {
  return ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [maintenance, setMaintenance] = useState<{ enabled: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/maintenance', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setMaintenance(d))
      .catch(() => setMaintenance({ enabled: false }))
  }, [])

  useEffect(() => {
    if (!maintenance?.enabled) return
    if (pathname.startsWith('/api/')) return
    if (isAllowed(pathname)) return
    if (isAdminRole(user?.role)) return
    router.replace('/manutencao')
  }, [maintenance, pathname, user?.role, router])

  if (maintenance?.enabled && !isAllowed(pathname) && !isAdminRole(user?.role)) {
    return null
  }

  return <>{children}</>
}
