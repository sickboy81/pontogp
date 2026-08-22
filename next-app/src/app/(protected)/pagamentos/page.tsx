'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react'

type Payment = { id: string; created: string; amount: number; status: string; description?: string; expand?: { plan?: { name?: string } } }

export default function PagamentosPage() {
  const [items, setItems] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    fetch('/api/payments/history', { credentials: 'include' })
      .then(async (r) => {
        const data = await r.json().catch(() => null)
        if (!r.ok) throw new Error(data?.error || 'Não foi possível carregar o histórico.')
        return data
      })
      .then((d) => setItems(d?.items || []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Não foi possível carregar o histórico.'))
      .finally(() => setLoading(false))
  }, [])
  const labels: Record<string, string> = { paid: 'Pago', pending: 'Aguardando', failed: 'Falhou', refunded: 'Estornado' }
  return <main className="mx-auto max-w-4xl px-4 py-8">
    <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Voltar ao dashboard</Link>
    <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-white"><CreditCard className="h-6 w-6 text-primary-400" />Histórico de pagamentos</h1>
    <p className="mb-6 text-sm text-slate-400">Consulte cobranças PIX, pagamentos aprovados e tentativas que precisam de atenção.</p>
    {loading ? <Loader2 aria-label="Carregando pagamentos" className="mx-auto h-8 w-8 animate-spin text-primary-400" /> : error ? <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">{error}</div> : items.length === 0 ? <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center text-slate-400">Nenhum pagamento encontrado.</div> : <div className="overflow-x-auto rounded-xl border border-slate-700"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-800 text-slate-300"><tr><th className="p-4">Data</th><th className="p-4">Plano</th><th className="p-4">Valor</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y divide-slate-700">{items.map((p) => <tr key={p.id}><td className="p-4 text-slate-300">{new Date(p.created).toLocaleDateString('pt-BR')}</td><td className="p-4 text-white">{p.expand?.plan?.name || p.description || 'Plano'}</td><td className="p-4 text-white">{Number(p.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td className="p-4 text-slate-300">{labels[p.status] || p.status}</td></tr>)}</tbody></table></div>}
  </main>
}
