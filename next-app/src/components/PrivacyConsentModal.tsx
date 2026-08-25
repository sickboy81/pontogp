'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, Cookie, ShieldCheck } from 'lucide-react'

export const CONSENT_STORAGE_KEY = 'cerejavip_site_consent'

type Consent = {
  adult: boolean
  necessary: true
  analytics: boolean
  preferences: boolean
}

function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!value) return null
    const parsed = JSON.parse(value) as Partial<Consent>
    return parsed.adult === true ? {
      adult: true,
      necessary: true,
      analytics: parsed.analytics === true,
      preferences: parsed.preferences === true,
    } : null
  } catch {
    return null
  }
}

export default function PrivacyConsentModal() {
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [preferences, setPreferences] = useState(false)

  useEffect(() => {
    const stored = readConsent()
    setConsent(stored)
    if (stored) {
      setAnalytics(stored.analytics)
      setPreferences(stored.preferences)
    }
  }, [])

  const saveConsent = (next: Omit<Consent, 'necessary'>) => {
    const value: Consent = { ...next, necessary: true }
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value))
    } catch {}
    setConsent(value)
  }

  if (consent !== null || typeof window === 'undefined') return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-300 bg-white text-left text-slate-900 shadow-2xl shadow-slate-950/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      >
        {!settingsOpen ? (
          <div className="grid md:grid-cols-[210px_1fr]">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-slate-950 p-6 text-white md:p-7">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-white/20" />
              <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full border border-white/10" />
              <div className="relative flex h-full flex-col">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-2xl font-black tracking-tight">18+</div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">CerejaVIP</p>
                <h2 className="mt-3 text-2xl font-bold leading-tight">Navegue com clareza e discrição.</h2>
                <p className="mt-auto pt-8 text-sm leading-relaxed text-white/75">Conteúdo adulto para maiores de 18 anos. Leia as regras antes de continuar.</p>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary-600 dark:text-primary-400" />
                <div>
                  <h3 id="consent-title" className="text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">Antes de entrar</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    A CerejaVIP é uma plataforma destinada exclusivamente a adultos. Ao continuar, você confirma ter 18 anos ou mais e concorda com os nossos{' '}
                    <Link href="/termos" className="font-semibold text-primary-700 hover:underline dark:text-primary-300">Termos</Link> e{' '}
                    <Link href="/privacidade" className="font-semibold text-primary-700 hover:underline dark:text-primary-300">Política de Privacidade</Link>.
                  </p>
                </div>
              </div>
              <div className="mt-7 rounded-2xl border border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <Cookie className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <h4 className="font-semibold text-slate-900 dark:text-white">Preferências de navegação</h4>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-400">Usamos cookies essenciais para segurança e login. Os opcionais ajudam a lembrar preferências e melhorar o serviço.</p>
              </div>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => setSettingsOpen(true)} className="rounded-xl border border-slate-400 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:bg-transparent dark:hover:text-white">Escolher cookies</button>
                <button type="button" onClick={() => saveConsent({ adult: true, analytics: true, preferences: true })} className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-500">Tenho 18 anos, continuar</button>
              </div>
              <p className="mt-5 text-xs text-slate-600 dark:text-slate-500">Detalhes em <Link href="/cookies" className="font-semibold text-primary-700 hover:underline dark:text-primary-300">Aviso de Cookies</Link> e <Link href="/privacidade" className="font-semibold text-primary-700 hover:underline dark:text-primary-300">Privacidade</Link>.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 sm:p-8">
            <h2 id="consent-title" className="text-xl font-bold text-slate-950 dark:text-white">Escolha seus cookies</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-400">
              Cookies necessários ficam sempre ativos porque permitem autenticação, segurança e funcionamento básico do CerejaVIP.
            </p>
            <div className="mt-6 space-y-3 text-left">
              <label className="flex items-center justify-between rounded-xl border border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-950/30">
                <span><strong className="block text-sm text-slate-900 dark:text-white">Necessários</strong><span className="text-xs text-slate-600 dark:text-slate-500">Sempre ativos</span></span>
                <Check className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-950/30">
                <span><strong className="block text-sm text-slate-900 dark:text-white">Preferências</strong><span className="text-xs text-slate-600 dark:text-slate-500">Tema e escolhas de navegação</span></span>
                <input type="checkbox" checked={preferences} onChange={(e) => setPreferences(e.target.checked)} className="h-4 w-4 accent-primary-600" />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-950/30">
                <span><strong className="block text-sm text-slate-900 dark:text-white">Análise</strong><span className="text-xs text-slate-600 dark:text-slate-500">Medição de uso, quando habilitada</span></span>
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="h-4 w-4 accent-primary-600" />
              </label>
            </div>
            <button
              type="button"
              onClick={() => saveConsent({ adult: true, analytics, preferences })}
              className="mt-6 w-full rounded-xl bg-primary-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-500"
            >
              Salvar preferências e continuar
            </button>
            <button type="button" onClick={() => setSettingsOpen(false)} className="mt-4 text-sm text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
              Voltar
            </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
