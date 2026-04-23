'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Wrench } from 'lucide-react'

export default function ManutencaoPage() {
  const [message, setMessage] = useState('Site em manutenção. Voltaremos em breve!')

  useEffect(() => {
    fetch('/api/maintenance', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.message) setMessage(d.message)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center rounded-2xl border border-slate-700 bg-slate-800/50 px-8 py-12 text-center">
        <Wrench className="mb-6 h-20 w-20 text-amber-500" />
        <h1 className="text-2xl font-bold text-white">Em manutenção</h1>
        <p className="mt-4 max-w-md text-slate-300">{message}</p>
        <p className="mt-6 text-sm text-slate-500">
          Administrador?{' '}
          <Link href="/admin" className="text-primary-500 hover:underline">
            Acessar painel
          </Link>
        </p>
      </div>
    </div>
  )
}
