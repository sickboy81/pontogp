'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Home, LogOut, LayoutDashboard, User, MessageCircle, CreditCard, Bell } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const DASHBOARD_TABS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/perfil', label: 'Perfil', icon: User },
  { href: '/mensagens', label: 'Mensagens', icon: MessageCircle },
  { href: '/planos', label: 'Planos', icon: CreditCard },
  { href: '/notificacoes', label: 'Notificações', icon: Bell },
]

function DashboardTabBar() {
  const pathname = usePathname()
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/dashboard/perfil') return pathname.startsWith('/dashboard/perfil')
    return pathname.startsWith(href)
  }
  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-slate-700 pb-4">
      {DASHBOARD_TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            isActive(tab.href)
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <tab.icon className="h-4 w-4 shrink-0" />
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const logout = useAuthStore((s) => s.logout)
  const [menuOpen, setMenuOpen] = useState(false)

  const isDashboardArea =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/mensagens' ||
    pathname === '/planos' ||
    pathname === '/notificacoes'

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    router.replace('/login')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" title="Página inicial">
            <img src="/logo-header.png" alt="CerejaVIP" className="h-9 w-auto max-h-10 object-contain md:h-12" />
          </Link>
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
                <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
                  {DASHBOARD_TABS.map((tab) => (
                    <Link key={tab.href} href={tab.href} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white" onClick={closeMenu}>
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-slate-600" />
                  <Link href="/" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white" onClick={closeMenu}>
                    <Home className="h-4 w-4" />
                    Início (site)
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
      <main className="mx-auto max-w-6xl px-4 py-8">
        {isDashboardArea && <DashboardTabBar />}
        {children}
      </main>
    </div>
  )
}
