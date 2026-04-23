'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import AnnouncementBar from '@/components/AnnouncementBar'

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAtProfileRoute = !!pathname && pathname.startsWith('/@')

  if (isAtProfileRoute) {
    // Perfil em formato "link na bio": tela limpa, sem chrome do site.
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main className="min-h-[calc(100vh-8rem)] flex-1">{children}</main>
      <footer className="border-t border-slate-700/50 bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-lg font-semibold text-white">CerejaVIP</p>
              <p className="mt-2 text-sm text-slate-400">
                Plataforma premium de classificados. Encontre acompanhantes, massagistas e atendimento online com segurança.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Navegação</p>
              <ul className="mt-3 space-y-2">
                <li><Link href="/" className="text-slate-400 hover:text-white">Início</Link></li>
                <li><Link href="/anunciantes" className="text-slate-400 hover:text-white">Anunciantes</Link></li>
                <li><Link href="/planos" className="text-slate-400 hover:text-white">Planos</Link></li>
                <li><Link href="/contato" className="text-slate-400 hover:text-white">Contato</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Legal</p>
              <ul className="mt-3 space-y-2">
                <li><Link href="/sobre" className="text-slate-400 hover:text-white">Sobre</Link></li>
                <li><Link href="/termos" className="text-slate-400 hover:text-white">Termos</Link></li>
                <li><Link href="/privacidade" className="text-slate-400 hover:text-white">Privacidade</Link></li>
                <li><Link href="/seguranca" className="text-slate-400 hover:text-white">Segurança</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Suporte</p>
              <ul className="mt-3 space-y-2">
                <li><Link href="/contato" className="text-slate-400 hover:text-white">Contato</Link></li>
                <li><Link href="/login" className="text-slate-400 hover:text-white">Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-slate-700/50 pt-6 text-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} CerejaVIP. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
