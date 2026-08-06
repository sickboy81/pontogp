'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles, Wrench } from 'lucide-react'

export default function ManutencaoPage() {
  const [message, setMessage] = useState('Estamos preparando novidades para você.')

  useEffect(() => {
    fetch('/api/maintenance', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.message === 'string' && d.message.trim()) setMessage(d.message)
      })
      .catch(() => {})
  }, [])

  return (
    <main className="maintenance-page relative isolate flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 text-slate-100">
      <div className="maintenance-orb maintenance-orb-one" aria-hidden="true" />
      <div className="maintenance-orb maintenance-orb-two" aria-hidden="true" />
      <div className="maintenance-grid" aria-hidden="true" />

      <section className="maintenance-card relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="grid items-stretch lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex min-h-[330px] flex-col justify-between overflow-hidden border-b border-white/10 bg-gradient-to-br from-red-950/70 via-slate-950/70 to-amber-950/50 p-8 sm:p-12 lg:border-b-0 lg:border-r">
            <div className="maintenance-sparkle absolute right-12 top-12 text-amber-300/80" aria-hidden="true"><Sparkles className="h-5 w-5" /></div>
            <div className="relative z-10">
              <div className="mb-10 flex items-center gap-3">
                <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15 text-red-300 ring-1 ring-red-300/20">
                  <span className="maintenance-pulse absolute h-11 w-11 rounded-2xl bg-red-400/20" />
                  <Wrench className="relative h-5 w-5" />
                </span>
                <span className="text-sm font-semibold tracking-[0.2em] text-slate-300">CEREJAVIP</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">Um breve intervalo</p>
              <h1 className="mt-4 max-w-sm text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl">
                Estamos deixando tudo ainda melhor.
              </h1>
            </div>
            <div className="relative z-10 mt-12 flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Seu acesso estará de volta em breve</span>
            </div>
          </div>

          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <div className="mb-8 flex items-center gap-3">
              <span className="maintenance-status-dot h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Manutenção em andamento</span>
            </div>
            <p className="max-w-xl text-lg leading-8 text-slate-300">{message}</p>
            <div className="mt-10 h-px w-full bg-gradient-to-r from-red-400/40 via-amber-300/20 to-transparent" />
            <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xs text-sm leading-6 text-slate-500">Estamos cuidando de cada detalhe para tornar sua próxima visita mais especial.</p>
              <Link href="/admin" className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-white transition hover:text-amber-200">
                Acessar painel
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
