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
  }, [])

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
            className={`relative border ${style.color} bg-slate-800/50 p-6 flex flex-col ${isPopular ? 'ring-1 ring-slate-400/50' : ''}`}
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
              className={`block text-center py-3 text-sm font-bold uppercase tracking-wider transition-all ${
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
