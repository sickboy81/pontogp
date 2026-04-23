'use client'

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import toast from 'react-hot-toast'

const SUBJECTS = [
  'Dúvida',
  'Sugestão',
  'Problema',
  'Reclamação',
  'Elogio',
  'Parceria',
  'Outro',
]

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        opts: {
          sitekey: string
          callback: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: string
          size?: string
        }
      ) => string
      remove: (id: string) => void
      reset: (id: string) => void
    }
  }
}

export default function ContatoClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) return

    const load = () => {
      if (!containerRef.current || turnstileRef.current) return
      const w = window.turnstile
      if (w) {
        const id = w.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => setTurnstileToken(token),
          'error-callback': () => setTurnstileToken(null),
          'expired-callback': () => setTurnstileToken(null),
          theme: 'dark',
          size: 'normal',
        })
        if (id) turnstileRef.current = id
      }
    }

    if (document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
      load()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
    script.onload = load

    return () => {
      if (turnstileRef.current && window.turnstile) {
        window.turnstile.remove(turnstileRef.current)
        turnstileRef.current = null
      }
    }
  }, [siteKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (siteKey && !turnstileToken) {
      toast.error('Complete a verificação de segurança')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          turnstileToken: turnstileToken ?? undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'Erro ao enviar')
      }
      toast.success('Mensagem enviada com sucesso!')
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTurnstileToken(null)
      if (turnstileRef.current && window.turnstile) {
        window.turnstile.reset(turnstileRef.current)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar mensagem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-white">Fale Conosco</h1>
      <p className="mt-4 mb-8 text-center text-slate-400">
        Dúvidas, sugestões ou problemas? Entre em contato.
      </p>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 sm:p-8"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-300">
              Nome *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
              Email *
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-300">
              Assunto *
            </label>
            <select
              id="subject"
              required
              value={formData.subject}
              onChange={(e) => setFormData((f) => ({ ...f, subject: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Selecione um assunto</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium text-slate-300">
              Mensagem *
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData((f) => ({ ...f, message: e.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {siteKey ? (
            <div className="flex justify-center">
              <div ref={containerRef} />
            </div>
          ) : (
            <p className="text-center text-xs text-slate-500">
              Verificação de segurança opcional (configure NEXT_PUBLIC_TURNSTILE_SITE_KEY).
            </p>
          )}

          <button
            type="submit"
            disabled={loading || (!!siteKey && !turnstileToken)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
            {loading ? 'Enviando...' : 'Enviar mensagem'}
          </button>
        </div>
      </form>
    </div>
  )
}
