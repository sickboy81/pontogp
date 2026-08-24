'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { BarChart3, Eye, MousePointer, MessageCircle, Phone, RefreshCw, Send, Users, UserCheck, AlertTriangle, Mail, Search } from 'lucide-react'

interface AnalyticsData {
  totalViews: number
  totalClicks: number
  viewsLast7Days: number
  viewsLast30Days: number
  clicksLast7Days: number
  clicksLast30Days: number
  clicksByType: { whatsapp: number; telegram: number; phone: number; message: number }
  daily: { date: string; views: number; clicks: number }[]
  activeProfiles: number
  totalUsers: number
  activeStories: number
  unreadContacts: number
  pendingReports: number
  ctr: number
  topProfilesByViews: { id: string; name: string; views: number; slug?: string }[]
  periodDays: number
  previousViews: number
  previousClicks: number
  viewsChangePct: number | null
  clicksChangePct: number | null
  searchAnalytics?: { searches: number; zeroResultSearches: number; topTerms: { term: string; count: number }[] }
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState<7 | 30 | 90>(30)

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const [r, searchResponse] = await Promise.all([
        fetch(`/api/admin/analytics?days=${period}`, { credentials: 'include', cache: 'no-store' }),
        fetch(`/api/admin/search-analytics?days=${period}`, { credentials: 'include', cache: 'no-store' }),
      ])
      const d = await r.json().catch(() => ({}))
      const searchAnalytics = await searchResponse.json().catch(() => ({ unavailable: true }))
      if (!r.ok) throw new Error(d.error || 'Não foi possível carregar os analytics.')
      setData({ ...d, searchAnalytics })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os analytics.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => {
    void load(true)
  }, [load])

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
    daily: [], activeProfiles: 0, totalUsers: 0, activeStories: 0, unreadContacts: 0, pendingReports: 0, ctr: 0,
      topProfilesByViews: [], periodDays: period, previousViews: 0, previousClicks: 0, viewsChangePct: null, clicksChangePct: null,
    searchAnalytics: { searches: 0, zeroResultSearches: 0, topTerms: [] },
  }
  const exportCsv = () => {
    const rows = [['data', 'visualizacoes', 'cliques'], ...d.daily.map((row) => [row.date, String(row.views), String(row.clicks)])]
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = `analytics-${d.periodDays}-dias.csv`; link.click(); URL.revokeObjectURL(url)
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
        <div className="flex gap-2">
          <select value={period} onChange={(e) => setPeriod(Number(e.target.value) as 7 | 30 | 90)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300"><option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option></select>
          <button type="button" onClick={() => void load()} disabled={refreshing} className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar
          </button>
          <Link href="/admin" className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">Voltar ao painel</Link>
          <button type="button" onClick={exportCsv} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">Exportar CSV</button>
        </div>
      </div>

      {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

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

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {([
          { label: 'Perfis ativos', value: d.activeProfiles, Icon: UserCheck, color: 'text-emerald-400' },
          { label: 'Usuários', value: d.totalUsers, Icon: Users, color: 'text-cyan-400' },
          { label: 'Cereja Stories ativos', value: d.activeStories, Icon: BarChart3, color: 'text-pink-400' },
          { label: 'Contatos não lidos', value: d.unreadContacts, Icon: Mail, color: 'text-amber-400' },
          { label: 'Denúncias pendentes', value: d.pendingReports, Icon: AlertTriangle, color: 'text-red-400' },
        ] as Array<{ label: string; value: number; Icon: typeof Users; color: string }>).map(({ label, value, Icon: MetricIcon, color }) => {
          return <div key={label} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"><div className={`flex items-center gap-2 text-sm ${color}`}><MetricIcon className="h-5 w-5" />{label}</div><p className="mt-2 text-2xl font-bold text-white">{value.toLocaleString('pt-BR')}</p></div>
        })}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Views e cliques por período</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Últimos 30 dias (views)</dt>
              <dd className="font-medium text-white">{d.viewsLast30Days.toLocaleString('pt-BR')}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-2"><dt className="text-slate-400">Comparação de views</dt><dd className={d.viewsChangePct !== null && d.viewsChangePct >= 0 ? 'text-emerald-400' : 'text-red-400'}>{d.viewsChangePct === null ? 'Sem base' : `${d.viewsChangePct >= 0 ? '+' : ''}${d.viewsChangePct}%`}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Comparação de cliques</dt><dd className={d.clicksChangePct !== null && d.clicksChangePct >= 0 ? 'text-emerald-400' : 'text-red-400'}>{d.clicksChangePct === null ? 'Sem base' : `${d.clicksChangePct >= 0 ? '+' : ''}${d.clicksChangePct}%`}</dd></div>
            <div className="flex justify-between border-t border-slate-700 pt-2">
              <dt className="text-slate-400">CTR (cliques / views)</dt>
              <dd className="font-medium text-primary-300">{d.ctr.toLocaleString('pt-BR')}%</dd>
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

      <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white"><Search className="h-5 w-5 text-primary-400" /> Buscas realizadas</h2>
        <p className="mb-4 text-sm text-slate-400">Consultas anônimas na home no período selecionado.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Consultas</p><p className="mt-1 text-2xl font-bold text-white">{d.searchAnalytics?.searches ?? 0}</p></div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Sem resultados</p><p className="mt-1 text-2xl font-bold text-amber-300">{d.searchAnalytics?.zeroResultSearches ?? 0}</p></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{(d.searchAnalytics?.topTerms ?? []).map((item) => <span key={item.term} className="rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs text-primary-200">{item.term} ({item.count})</span>)}{(d.searchAnalytics?.topTerms ?? []).length === 0 && <span className="text-sm text-slate-500">Ainda não há buscas registradas.</span>}</div>
      </div>

      <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-white">Atividade dos últimos 30 dias</h2><p className="text-sm text-slate-400">Eventos reais de visualização e contato</p></div><div className="flex gap-4 text-xs text-slate-400"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-primary-400" />Views</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />Cliques</span></div></div>
        <div className="flex h-48 items-end gap-1 overflow-hidden border-b border-slate-700 pb-1">
          {d.daily.map((row) => { const max = Math.max(1, ...d.daily.map((item) => Math.max(item.views, item.clicks))); return <div key={row.date} className="group flex h-full min-w-[8px] flex-1 items-end justify-center gap-px" title={`${row.date}: ${row.views} views, ${row.clicks} cliques`}><div className="w-1/2 rounded-t bg-primary-400/80" style={{ height: `${Math.max(row.views ? 4 : 0, (row.views / max) * 100)}%` }} /><div className="w-1/2 rounded-t bg-emerald-400/80" style={{ height: `${Math.max(row.clicks ? 4 : 0, (row.clicks / max) * 100)}%` }} /></div> })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>{d.daily[0]?.date || '—'}</span><span>{d.daily.at(-1)?.date || '—'}</span></div>
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
