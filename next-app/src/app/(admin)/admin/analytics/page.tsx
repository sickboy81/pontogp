'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, Eye, MousePointer, MessageCircle, Phone, Send } from 'lucide-react'

interface AnalyticsData {
  totalViews: number
  totalClicks: number
  viewsLast7Days: number
  viewsLast30Days: number
  clicksLast7Days: number
  clicksLast30Days: number
  clicksByType: { whatsapp: number; telegram: number; phone: number; message: number }
  topProfilesByViews: { id: string; name: string; views: number; slug?: string }[]
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-white">Analytics</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/50" />
          ))}
        </div>
      </div>
    )
  }

  const d = data ?? {
    totalViews: 0,
    totalClicks: 0,
    viewsLast7Days: 0,
    viewsLast30Days: 0,
    clicksLast7Days: 0,
    clicksLast30Days: 0,
    clicksByType: { whatsapp: 0, telegram: 0, phone: 0, message: 0 },
    topProfilesByViews: [],
  }

  const typeLabels: Record<keyof typeof d.clicksByType, string> = {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    phone: 'Ligar',
    message: 'Mensagem',
  }
  const typeIcons: Record<keyof typeof d.clicksByType, typeof MessageCircle> = {
    whatsapp: MessageCircle,
    telegram: Send,
    phone: Phone,
    message: MessageCircle,
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
        >
          Voltar ao painel
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-center gap-2 text-blue-400">
            <Eye className="h-6 w-6" />
            <span className="text-sm font-medium">Visualizações totais</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{d.totalViews.toLocaleString('pt-BR')}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-center gap-2 text-green-400">
            <MousePointer className="h-6 w-6" />
            <span className="text-sm font-medium">Cliques totais</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{d.totalClicks.toLocaleString('pt-BR')}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-center gap-2 text-amber-400">
            <BarChart3 className="h-6 w-6" />
            <span className="text-sm font-medium">Views (últimos 7 dias)</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{d.viewsLast7Days.toLocaleString('pt-BR')}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-center gap-2 text-violet-400">
            <BarChart3 className="h-6 w-6" />
            <span className="text-sm font-medium">Cliques (últimos 7 dias)</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{d.clicksLast7Days.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Views e cliques por período</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Últimos 30 dias (views)</dt>
              <dd className="font-medium text-white">{d.viewsLast30Days.toLocaleString('pt-BR')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Últimos 30 dias (cliques)</dt>
              <dd className="font-medium text-white">{d.clicksLast30Days.toLocaleString('pt-BR')}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Cliques por tipo de contato</h2>
          <ul className="space-y-2">
            {(Object.entries(d.clicksByType) as [keyof typeof d.clicksByType, number][]).map(([key, count]) => {
              const Icon = typeIcons[key]
              return (
                <li key={key} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Icon className="h-4 w-4" />
                    {typeLabels[key]}
                  </span>
                  <span className="font-medium text-white">{count.toLocaleString('pt-BR')}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Top 10 perfis por visualizações</h2>
        {d.topProfilesByViews.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum dado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600 text-left text-slate-400">
                  <th className="pb-2 pr-4">Perfil</th>
                  <th className="pb-2 pr-4">Visualizações</th>
                  <th className="pb-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {d.topProfilesByViews.map((p) => (
                  <tr key={p.id} className="border-b border-slate-700/50">
                    <td className="py-2 pr-4 font-medium text-white">{p.name}</td>
                    <td className="py-2 pr-4 text-slate-300">{p.views.toLocaleString('pt-BR')}</td>
                    <td className="py-2">
                      <Link
                        href={p.slug ? `/${p.slug}` : `/perfil/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:underline"
                      >
                        Ver perfil
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
