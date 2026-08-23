'use client'

import { useState, useEffect, type ComponentType } from 'react'
import Link from 'next/link'
import {
  Users,
  UserCircle,
  MessageSquare,
  AlertTriangle,
  Settings,
  ShieldCheck,
  BarChart3,
  Megaphone,
  Tag,
  CreditCard,
  Wrench,
  Bell,
  TimerReset,
  FolderKanban,
  Repeat,
  Mail,
  UserPlus,
  CheckCircle2,
  Film,
  Clock,
} from 'lucide-react'

interface Stats {
  totalUsers: number
  totalProfiles: number
  pendingReports: number
  unreadMessages: number
  pendingVerifications?: number
  unreadContacts?: number
  activeSubscriptions?: number
  totalRevenue?: number
  pendingPayments?: number
  activeProfiles?: number
  newUsers7d?: number
  totalStories?: number
}

type Card = {
  title: string
  value: string | number
  href: string
  icon: ComponentType<{ className?: string }>
  color: string
  /** Destaca contagem de fila (pendências) */
  highlight?: 'warning' | 'danger'
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
      <div className="admin-dashboard">
        <h1 className="mb-6 text-2xl font-bold text-white">Centro de controle</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/50" />
          ))}
        </div>
      </div>
    )
  }

  const s = stats ?? ({} as Stats)
  const queueCount =
    (s.pendingReports || 0) +
    (s.pendingVerifications || 0) +
    (s.unreadMessages || 0) +
    (s.unreadContacts || 0) +
    (s.pendingPayments || 0)

  const sectionData: { id: string; title: string; lead: string; cards: Card[] }[] = [
    {
      id: 'overview',
      title: 'Plataforma (visão geral)',
      lead: 'Crescimento, inventário e receita. Os números vêm do banco em tempo real.',
      cards: [
        { title: 'Usuários cadastrados', value: s.totalUsers ?? 0, href: '/admin/usuarios', icon: Users, color: 'text-blue-400' },
        { title: 'Novos usuários (7 dias)', value: s.newUsers7d ?? 0, href: '/admin/usuarios', icon: UserPlus, color: 'text-cyan-400' },
        { title: 'Perfis (todos os status)', value: s.totalProfiles ?? 0, href: '/admin/perfis', icon: UserCircle, color: 'text-green-400' },
        { title: 'Perfis ativos', value: s.activeProfiles ?? 0, href: '/admin/perfis', icon: CheckCircle2, color: 'text-emerald-400' },
        { title: 'Cereja Stories (registros no sistema)', value: s.totalStories ?? 0, href: '/admin/perfis', icon: Film, color: 'text-fuchsia-400' },
        { title: 'Receita total (pagamentos ok)', value: formatMoney(s.totalRevenue ?? 0), href: '/admin/pagamentos', icon: CreditCard, color: 'text-amber-400' },
      ],
    },
    {
      id: 'queue',
      title: 'Fila: exige tua ação',
      lead:
        'Denúncias, verificação, caixa de entrada e PIX pendente. Priorize o que tiver anel de alerta no card.',
      cards: [
        {
          title: 'Mensagens não lidas',
          value: s.unreadMessages ?? 0,
          href: '/admin/mensagens',
          icon: MessageSquare,
          color: 'text-amber-400',
          highlight: (s.unreadMessages ?? 0) > 0 ? 'warning' : undefined,
        },
        {
          title: 'Contatos (Fale conosco) novos',
          value: s.unreadContacts ?? 0,
          href: '/admin/contatos',
          icon: Mail,
          color: 'text-cyan-400',
          highlight: (s.unreadContacts ?? 0) > 0 ? 'warning' : undefined,
        },
        {
          title: 'Denúncias pendentes',
          value: s.pendingReports ?? 0,
          href: '/admin/denuncias',
          icon: AlertTriangle,
          color: 'text-red-400',
          highlight: (s.pendingReports ?? 0) > 0 ? 'danger' : undefined,
        },
        {
          title: 'Verificações pendentes',
          value: s.pendingVerifications ?? 0,
          href: '/admin/verificacao',
          icon: ShieldCheck,
          color: 'text-violet-400',
          highlight: (s.pendingVerifications ?? 0) > 0 ? 'warning' : undefined,
        },
        {
          title: 'Pagamentos PIX pendentes',
          value: s.pendingPayments ?? 0,
          href: '/admin/pagamentos',
          icon: Clock,
          color: 'text-orange-400',
          highlight: (s.pendingPayments ?? 0) > 0 ? 'warning' : undefined,
        },
      ],
    },
    {
      id: 'monetization',
      title: 'Monetização e planos',
      lead: 'Preços, assinaturas, cupons e movimentos financeiros.',
      cards: [
        { title: 'Assinaturas ativas', value: s.activeSubscriptions ?? 0, href: '/admin/assinaturas', icon: Repeat, color: 'text-sky-400' },
        { title: 'Editar planos (preços, bumps)', value: '→', href: '/admin/planos', icon: FolderKanban, color: 'text-lime-400' },
        { title: 'Cupons de desconto', value: '→', href: '/admin/cupons', icon: Tag, color: 'text-amber-400' },
        { title: 'Lista de pagamentos', value: '→', href: '/admin/pagamentos', icon: CreditCard, color: 'text-emerald-400' },
        { title: 'Expiração por plano (dias busca/contato)', value: '→', href: '/admin/configuracao#expiracao-planos', icon: TimerReset, color: 'text-indigo-400' },
      ],
    },
    {
      id: 'insights',
      title: 'Dados, comunicação e site',
      lead: 'Tráfego agregado, anúncios a todos e parâmetros do site.',
      cards: [
        { title: 'Analytics (views, cliques, top perfis)', value: '→', href: '/admin/analytics', icon: BarChart3, color: 'text-cyan-400' },
        { title: 'Broadcast (notificação / push)', value: '→', href: '/admin/broadcast', icon: Megaphone, color: 'text-amber-400' },
        { title: 'Configurações gerais', value: '→', href: '/admin/configuracao', icon: Settings, color: 'text-slate-400' },
        { title: 'Modo manutenção', value: '→', href: '/admin/configuracao#manutencao', icon: Wrench, color: 'text-orange-400' },
        { title: 'Aviso do topo (banner)', value: '→', href: '/admin/configuracao#aviso-topo', icon: Bell, color: 'text-yellow-400' },
      ],
    },
  ]

  return (
    <div className="admin-dashboard">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Centro de controle</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Mapa geral: usuários, anúncios, filas de moderação, finanças e canais (analytics, avisos, manutenção). Cada
          card abre a tela em que você <strong className="text-slate-300">lista, edita e resolve</strong> — tudo
          continua acessível pelo menu <span className="text-slate-300">Admin</span> no canto superior.
        </p>
        {queueCount > 0 && (
          <p className="admin-queue-alert mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {queueCount} itens na fila (mensagens, contatos, denúncias, verificação, PIX pendentes). Confira a seção
            <strong className="mx-1 text-amber-100">Fila</strong> abaixo.
          </p>
        )}
      </div>

      {sectionData.map((section) => (
        <section key={section.id} className="mb-10">
          <h2 className="text-lg font-semibold text-white">{section.title}</h2>
          <p className="mb-4 mt-1 max-w-3xl text-sm text-slate-500">{section.lead}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.cards.map((card) => {
              const Icon = card.icon
              const ring =
                card.highlight === 'danger'
                  ? 'ring-1 ring-red-500/40'
                  : card.highlight === 'warning'
                    ? 'ring-1 ring-amber-500/30'
                    : ''
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className={`admin-dashboard-card rounded-xl border border-slate-700 bg-slate-800/50 p-5 transition hover:border-slate-600 hover:bg-slate-800/70 ${ring}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`${card.color} shrink-0`}>
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className="min-w-0 break-words text-right text-2xl font-bold text-white">{card.value}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{card.title}</p>
                </Link>
              )
            })}
          </div>
        </section>
      ))}

      <p className="text-xs text-slate-500">
        A página <Link href="/admin/analytics" className="text-primary-400 hover:underline">Analytics</Link> reúne
        views, cliques e canais como no painel do anunciante, porém <strong>agregado no site todo</strong> e com
        ranking de perfis.
      </p>
    </div>
  )
}
