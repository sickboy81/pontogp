'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, UserCircle, MessageSquare, AlertTriangle, Settings, ShieldCheck, BarChart3, Megaphone, Tag, CreditCard, Wrench, Bell, TimerReset, FolderKanban, Repeat, Mail } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalProfiles: number
  pendingReports: number
  unreadMessages: number
  pendingVerifications?: number
  unreadContacts?: number
  activeSubscriptions?: number
  totalRevenue?: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStats(data || null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-white">Painel</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-slate-800/50"
            />
          ))}
        </div>
      </div>
    )
  }

  const cards = [
    {
      title: 'Usuários',
      value: stats?.totalUsers ?? 0,
      href: '/admin/usuarios',
      icon: Users,
      color: 'text-blue-400',
    },
    {
      title: 'Perfis',
      value: stats?.totalProfiles ?? 0,
      href: '/admin/perfis',
      icon: UserCircle,
      color: 'text-green-400',
    },
    {
      title: 'Mensagens não lidas',
      value: stats?.unreadMessages ?? 0,
      href: '/admin/mensagens',
      icon: MessageSquare,
      color: 'text-amber-400',
    },
    {
      title: 'Contatos não lidos',
      value: stats?.unreadContacts ?? 0,
      href: '/admin/contatos',
      icon: Mail,
      color: 'text-cyan-400',
    },
    {
      title: 'Denúncias pendentes',
      value: stats?.pendingReports ?? 0,
      href: '/admin/denuncias',
      icon: AlertTriangle,
      color: 'text-red-400',
    },
    {
      title: 'Verificações pendentes',
      value: stats?.pendingVerifications ?? 0,
      href: '/admin/verificacao',
      icon: ShieldCheck,
      color: 'text-violet-400',
    },
    {
      title: 'Planos',
      value: '→',
      href: '/admin/planos',
      icon: FolderKanban,
      color: 'text-lime-400',
    },
    {
      title: 'Assinaturas',
      value: stats?.activeSubscriptions ?? 0,
      href: '/admin/assinaturas',
      icon: Repeat,
      color: 'text-sky-400',
    },
    {
      title: 'Cupons',
      value: '→',
      href: '/admin/cupons',
      icon: Tag,
      color: 'text-amber-400',
    },
    {
      title: 'Receita total',
      value: formatMoney(stats?.totalRevenue ?? 0),
      href: '/admin/pagamentos',
      icon: CreditCard,
      color: 'text-emerald-400',
    },
    {
      title: 'Pagamentos',
      value: '→',
      href: '/admin/pagamentos',
      icon: CreditCard,
      color: 'text-emerald-400',
    },
    {
      title: 'Analytics',
      value: '→',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'text-cyan-400',
    },
    {
      title: 'Broadcast',
      value: '→',
      href: '/admin/broadcast',
      icon: Megaphone,
      color: 'text-amber-400',
    },
    {
      title: 'Configurações',
      value: '→',
      href: '/admin/configuracao',
      icon: Settings,
      color: 'text-slate-400',
    },
    {
      title: 'Manutenção',
      value: '→',
      href: '/admin/configuracao#manutencao',
      icon: Wrench,
      color: 'text-orange-400',
    },
    {
      title: 'Aviso do topo',
      value: '→',
      href: '/admin/configuracao#aviso-topo',
      icon: Bell,
      color: 'text-yellow-400',
    },
    {
      title: 'Expiração por plano',
      value: '→',
      href: '/admin/configuracao#expiracao-planos',
      icon: TimerReset,
      color: 'text-indigo-400',
    },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Painel</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 transition hover:border-slate-600 hover:bg-slate-800/70"
            >
              <div className="flex items-center justify-between">
                <span className={`${card.color}`}>
                  <Icon className="h-8 w-8" />
                </span>
                <span className="text-2xl font-bold text-white">
                  {card.value}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{card.title}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
