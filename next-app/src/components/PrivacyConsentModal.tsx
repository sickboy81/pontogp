'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl sm:p-8"
      >
        {!settingsOpen ? (
          <>
            <h2 id="consent-title" className="text-xl font-bold text-slate-900 sm:text-2xl">
              Informações sobre conteúdo adulto
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-slate-500">
              Este site contém conteúdo destinado a adultos. O acesso é permitido somente para maiores de 18 anos. Ao continuar, você confirma que tem 18 anos ou mais.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
              Consulte nossos{' '}
              <Link href="/termos" className="font-medium text-primary-600 hover:underline">Termos e Condições</Link>{' '}
              e nossa{' '}
              <Link href="/privacidade" className="font-medium text-primary-600 hover:underline">Política de Privacidade</Link>{' '}.
            </p>

            <div className="my-7 border-t border-slate-200" />

            <h3 className="text-lg font-bold text-slate-900">Sua experiência de navegação</h3>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
              Usamos cookies necessários para o funcionamento do site e, com sua autorização, cookies opcionais para lembrar preferências e melhorar a experiência.
            </p>

            <button
              type="button"
              onClick={() => saveConsent({ adult: true, analytics: true, preferences: true })}
              className="mt-6 w-full rounded-xl bg-primary-600 px-4 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-primary-500"
            >
              Aceitar todos e continuar
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="mt-4 text-sm font-medium uppercase tracking-wide text-primary-600 hover:underline"
            >
              Configurações de cookies
            </button>
            <p className="mt-6 text-xs leading-relaxed text-slate-500">
              Para mais informações, consulte o{' '}
              <Link href="/cookies" className="text-primary-600 hover:underline">Aviso de Cookies</Link>{' '}e a{' '}
              <Link href="/privacidade" className="text-primary-600 hover:underline">Política de Privacidade</Link>.
            </p>
          </>
        ) : (
          <>
            <h2 id="consent-title" className="text-xl font-bold text-slate-900">Configurações de cookies</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Cookies necessários ficam sempre ativos porque permitem autenticação, segurança e funcionamento básico do CerejaVIP.
            </p>
            <div className="mt-6 space-y-3 text-left">
              <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <span><strong className="block text-sm text-slate-900">Necessários</strong><span className="text-xs text-slate-500">Sempre ativos</span></span>
                <input type="checkbox" checked disabled className="h-4 w-4 accent-primary-600" />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <span><strong className="block text-sm text-slate-900">Preferências</strong><span className="text-xs text-slate-500">Tema e escolhas de navegação</span></span>
                <input type="checkbox" checked={preferences} onChange={(e) => setPreferences(e.target.checked)} className="h-4 w-4 accent-primary-600" />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <span><strong className="block text-sm text-slate-900">Análise</strong><span className="text-xs text-slate-500">Medição de uso, quando habilitada</span></span>
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
            <button type="button" onClick={() => setSettingsOpen(false)} className="mt-4 text-sm text-slate-500 hover:text-slate-900">
              Voltar
            </button>
          </>
        )}
      </section>
    </div>
  )
}
