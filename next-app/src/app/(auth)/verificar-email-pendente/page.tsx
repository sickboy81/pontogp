'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getPb } from '@/lib/pb'
import toast from 'react-hot-toast'
import { parseRegistrationRole } from '@/lib/registration-role.mjs'

const ROLE_NEXT_STEP = {
  advertiser: {
    title: 'Depois da confirmação, você poderá montar e publicar seu perfil.',
    linkHref: '/dashboard/perfil',
    linkLabel: 'Ir para criar perfil depois da confirmação',
  },
  user: {
    title: 'Depois da confirmação, você poderá explorar perfis, favoritos e mensagens.',
    linkHref: '/login',
    linkLabel: 'Entrar após confirmar o email',
  },
  default: {
    title: 'Depois da confirmação, faça login para continuar no CerejaVIP.',
    linkHref: '/login',
    linkLabel: 'Ir para login',
  },
} as const

function VerificarEmailPendenteContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const role = parseRegistrationRole(searchParams.get('tipo'))
  const [loading, setLoading] = useState(false)
  const nextStep = role ? ROLE_NEXT_STEP[role] : ROLE_NEXT_STEP.default

  const handleResend = async () => {
    if (!email) {
      toast.error('Email não informado')
      return
    }
    try {
      setLoading(true)
      await getPb().collection('users').requestVerification(email)
      toast.success('Email reenviado. Verifique sua caixa de entrada.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao reenviar'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h1 className="text-xl font-bold text-white">Confirme seu email</h1>
      <p className="mt-2 text-slate-400">
        Enviamos um link de verificação para <strong className="text-white">{email || 'seu email'}</strong>.
        Acesse sua caixa de entrada e clique no link para ativar sua conta.
      </p>
      <p className="mt-4 text-sm text-slate-400">
        Não recebeu? Verifique a pasta de spam ou clique abaixo para reenviar.
      </p>
      <p className="mt-4 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
        {nextStep.title}
      </p>
      <button
        type="button"
        onClick={handleResend}
        disabled={loading}
        className="mt-4 w-full rounded-lg border border-slate-600 py-3 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Reenviar email'}
      </button>
      <p className="mt-6 text-center">
        <Link href={nextStep.linkHref} className="text-primary-400 hover:underline">
          {nextStep.linkLabel}
        </Link>
      </p>
    </div>
  )
}

export default function VerificarEmailPendentePage() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-slate-400">Carregando...</div>}>
      <VerificarEmailPendenteContent />
    </Suspense>
  )
}
