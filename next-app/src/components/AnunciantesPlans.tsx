'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

type Plan = {
  slug: string
  name: string
  price_weekly?: number
  features?: string[]
  daily_bumps?: number
}

const planStyles: Record<string, { color: string; textColor: string }> = {
  gratis: { color: 'border-slate-600', textColor: 'text-slate-400' },
  bronze: { color: 'border-amber-700', textColor: 'text-amber-600' },
  prata: { color: 'border-slate-400', textColor: 'text-slate-300' },
  ouro: { color: 'border-amber-400', textColor: 'text-amber-400' },
}

function formatPrice(price: number) {
  if (price <= 0) return 'Grátis'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
}

export default function AnunciantesPlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/plans?enabledOnly=true')
      .then((r) => r.json())
      .then((data: Plan[]) => {
        const order = ['gratis', 'bronze', 'prata', 'ouro']
        const sorted = data
          .filter((p) => order.includes(p.slug))
          .sort((a, b) => {
            const ai = order.indexOf(a.slug)
            const bi = order.indexOf(b.slug)
            if (ai === -1 && bi === -1) return (a.price_weekly || 0) - (b.price_weekly || 0)
            if (ai === -1) return 1
            if (bi === -1) return -1
            return ai - bi
          })
        setPlans(sorted)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Carregando planos">
        {['gratis', 'bronze', 'prata', 'ouro'].map((slug) => (
          <div key={slug} className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/[.05] p-6">
            <div className="h-5 w-24 rounded bg-white/10" />
            <div className="mt-5 h-9 w-32 rounded bg-white/10" />
            <div className="mt-8 space-y-3"><div className="h-3 rounded bg-white/10" /><div className="h-3 rounded bg-white/10" /><div className="h-3 rounded bg-white/10" /></div>
            <div className="mt-8 h-11 rounded-lg bg-white/10" />
          </div>
        ))}
      </div>
    )
  }

  if (!plans.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[.04] px-6 py-10 text-center">
        <p className="font-semibold text-white">Os planos estão sendo carregados.</p>
        <p className="mt-2 text-sm text-slate-400">Você pode consultar os valores e recursos na página completa de planos.</p>
        <Link href="/planos" className="mt-5 inline-flex rounded-lg bg-primary-600 px-5 py-3 text-sm font-bold text-white">Ver planos</Link>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
      {plans.map((plan) => {
        const style = planStyles[plan.slug] || { color: 'border-slate-600', textColor: 'text-slate-400' }
        const isPopular = plan.slug === 'prata'
        const isFree = (plan.price_weekly || 0) <= 0
        const isTop = plan.slug === 'ouro'
        return (
          <div
            key={plan.slug}
            className={`relative flex flex-col rounded-2xl border ${style.color} bg-white/[.05] p-6 shadow-lg shadow-black/10 ${isPopular ? 'ring-1 ring-slate-400/50' : ''} ${isTop ? 'bg-gradient-to-b from-amber-500/15 to-white/[.04] shadow-amber-950/20' : ''}`}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1 tracking-wider uppercase">
                Mais mídia
              </div>
            )}
            <div className="mb-6">
              <h3 className={`text-xl font-bold ${style.textColor} mb-1`}>{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">
                  {isFree ? 'Grátis' : formatPrice(plan.price_weekly || 0)}
                </span>
                {!isFree && <span className="text-slate-500 text-sm">/semana</span>}
                {isFree && <span className="text-slate-500 text-sm">para sempre</span>}
              </div>
            </div>
            <ul className="space-y-3 mb-6 flex-grow">
              {Array.isArray(plan.features) && plan.features.slice(0, 5).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{f}</span>
                </li>
              ))}
              {plan.daily_bumps != null && plan.daily_bumps > 0 && (
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{plan.daily_bumps} bump{plan.daily_bumps > 1 ? 's' : ''}/dia</span>
                </li>
              )}
            </ul>
            <Link
              href={isFree ? '/register?tipo=advertiser' : '/planos'}
                className={`block rounded-lg py-3 text-center text-sm font-bold uppercase tracking-wider transition-all ${
                isTop
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500'
                  : isPopular
                    ? 'bg-white text-black hover:bg-slate-200'
                    : 'border border-slate-600 text-white hover:bg-slate-700'
              }`}
            >
              {isFree ? 'Criar Perfil' : 'Escolher Plano'}
            </Link>
          </div>
        )
      })}
    </div>
  )
}
