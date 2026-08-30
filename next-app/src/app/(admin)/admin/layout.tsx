'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, LayoutDashboard, Globe, LogOut } from 'lucide-react'
import { useAuthStore, isAdminRole } from '@/store/auth'
import { isAuthTokenExpired, setAuthCookie } from '@/lib/auth-cookie'
import { resolveAdminAccess } from '@/lib/admin-access.mjs'

const ADMIN_LINKS = [
  { href: '/admin', label: 'Painel' },
  { href: '/admin/usuarios', label: 'Usuários' },
  { href: '/admin/perfis', label: 'Perfis' },
  { href: '/admin/emails', label: 'Central de emails' },
  { href: '/admin/verificacao', label: 'Verificação' },
  { href: '/admin/mensagens', label: 'Chats (interno)' },
  { href: '/admin/contatos', label: 'Contatos (Fale Conosco)' },
  { href: '/admin/denuncias', label: 'Denúncias' },
  { href: '/admin/planos', label: 'Planos' },
  { href: '/admin/assinaturas', label: 'Assinaturas' },
  { href: '/admin/pagamentos', label: 'Pagamentos' },
  { href: '/admin/cupons', label: 'Cupons' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/broadcast', label: 'Broadcast' },
  { href: '/admin/configuracao', label: 'Configurações' },
  { href: '/admin/configuracao#manutencao', label: 'Manutenção' },
  { href: '/admin/configuracao#aviso-topo', label: 'Aviso do topo' },
  { href: '/admin/configuracao#expiracao-planos', label: 'Expiração por plano' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const logout = useAuthStore((s) => s.logout)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authHydrated, setAuthHydrated] = useState(false)
  const [serverValidation, setServerValidation] = useState<{
    token: string
    authenticated: boolean
  } | null>(null)

  useEffect(() => {
    const p = useAuthStore.persist
    if (p.hasHydrated()) setAuthHydrated(true)
    return p.onFinishHydration(() => setAuthHydrated(true))
  }, [])

  useEffect(() => {
    if (!authHydrated) return

    if (!isAuthenticated || !user || !token) {
      router.replace('/login?callbackUrl=/admin')
      return
    }

    if (isAuthTokenExpired(token)) {
      void logout().finally(() => router.replace('/login?callbackUrl=/admin'))
      return
    }

    if (!isAdminRole(user.role)) {
      router.replace('/dashboard')
      return
    }

    let cancelled = false
    const controller = new AbortController()
    setAuthCookie(token)
    fetch('/api/admin/session', {
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        if (cancelled) return
        if (data.authenticated === true) {
          setServerValidation({ token, authenticated: true })
          return
        }
        setServerValidation({ token, authenticated: false })
        void logout().finally(() => router.replace('/login?callbackUrl=/admin'))
      })
      .catch((error: unknown) => {
        if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) return
        setServerValidation({ token, authenticated: false })
        void logout().finally(() => router.replace('/login?callbackUrl=/admin'))
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [authHydrated, isAuthenticated, user, token, logout, router])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    router.replace('/login')
  }

  const closeMenu = () => setMenuOpen(false)

  const access = resolveAdminAccess({
    hydrated: authHydrated,
    authenticated: isAuthenticated,
    hasUser: Boolean(user),
    hasToken: Boolean(token),
    tokenExpired: Boolean(token && isAuthTokenExpired(token)),
    adminRole: isAdminRole(user?.role),
    serverAuthenticated:
      token && serverValidation?.token === token ? serverValidation.authenticated : null,
  })

  if (access !== 'ready' || !user) return null

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex shrink-0 items-center" title="Página inicial">
              <img src="/logo-header.png" alt="CerejaVIP" className="h-9 w-auto max-h-10 object-contain md:h-12" />
            </Link>
            <Link href="/admin" className="text-lg font-semibold text-amber-400 hover:text-amber-300">
              Admin
            </Link>
          </div>

          <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Menu"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" aria-hidden onClick={closeMenu} />
                  <div className="absolute right-0 top-full z-50 mt-1 max-h-[80vh] min-w-[200px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
                    {ADMIN_LINKS.map((link) => (
                      <Link key={link.href} href={link.href} className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white" onClick={closeMenu}>
                        {link.label}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-slate-600" />
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white" onClick={closeMenu}>
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard anunciante
                    </Link>
                    <Link href="/" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white" onClick={closeMenu}>
                      <Globe className="h-4 w-4" />
                      Site
                    </Link>
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-red-300">
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </>
              )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
