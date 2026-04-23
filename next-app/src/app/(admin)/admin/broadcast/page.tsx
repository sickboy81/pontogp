'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('Mensagem da equipe')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ totalUsers: number; notificationsCreated: number; failed: number } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      toast.error('Digite a mensagem')
      return
    }
    if (!confirm(`Enviar esta notificação para TODOS os usuários cadastrados? Esta ação não pode ser desfeita.`)) {
      return
    }
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim() || 'Mensagem da equipe',
          message: message.trim(),
          link: link.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { error?: string }).error || 'Erro ao enviar')
        return
      }
      setResult({
        totalUsers: (data as { totalUsers?: number }).totalUsers ?? 0,
        notificationsCreated: (data as { notificationsCreated?: number }).notificationsCreated ?? 0,
        failed: (data as { failed?: number }).failed ?? 0,
      })
      toast.success('Broadcast enviado!')
      setMessage('')
    } catch {
      toast.error('Erro ao enviar broadcast')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-white">Broadcast</h1>
      <p className="mb-6 text-sm text-slate-400">
        Envia uma notificação para todos os usuários cadastrados. Eles verão no sino de notificações.
      </p>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-6 rounded-xl border border-slate-700 bg-slate-800/50 p-6"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Título (opcional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Mensagem da equipe"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Mensagem *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            required
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Digite o texto que todos os usuários receberão..."
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Link (opcional)</label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="/planos ou https://..."
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 font-semibold text-white transition hover:bg-primary-500 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Enviando...' : 'Enviar para todos'}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Resultado</h2>
          <ul className="space-y-1 text-sm text-slate-300">
            <li>Usuários no sistema: {result.totalUsers}</li>
            <li>Notificações criadas: {result.notificationsCreated}</li>
            {result.failed > 0 && <li className="text-amber-400">Falhas: {result.failed}</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
