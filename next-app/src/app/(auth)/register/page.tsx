'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { ArrowLeft, Eye, EyeOff, Heart, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import RegistrationRoleChooser from '@/components/RegistrationRoleChooser'
import { parseRegistrationRole } from '@/lib/registration-role.mjs'
import { getRegistrationNextUrl } from '@/lib/registration-flow.mjs'

type RegistrationRole = 'user' | 'advertiser'

const ROLE_COPY: Record<
  RegistrationRole,
  {
    label: string
    title: string
    description: string
    nextStep: string
  }
> = {
  advertiser: {
    label: 'Anunciante',
    title: 'Crie sua conta de anunciante',
    description: 'Depois do cadastro você poderá criar, completar e publicar seu perfil no CerejaVIP.',
    nextStep: 'Após entrar, você segue para montar e publicar seu perfil.',
  },
  user: {
    label: 'Cliente',
    title: 'Crie sua conta de cliente',
    description: 'Depois do cadastro você poderá favoritar perfis, enviar mensagens internas e acompanhar anúncios.',
    nextStep: 'Após entrar, você já poderá explorar favoritos e conversas.',
  },
}

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register } = useAuthStore()
  const [role, setRole] = useState<RegistrationRole | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRole(parseRegistrationRole(searchParams.get('tipo')))
  }, [searchParams])

  const selectRole = (nextRole: RegistrationRole) => {
    setRole(nextRole)
    router.replace(`/register?tipo=${nextRole}`, { scroll: false })
  }

  const resetRole = () => {
    setRole(null)
    router.replace('/register', { scroll: false })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      toast.error('Escolha primeiro o tipo da conta')
      return
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres')
      return
    }
    if (!acceptedTerms) {
      toast.error('Aceite os termos de uso para criar uma conta')
      return
    }
    try {
      setLoading(true)
      const firstName = name.trim().split(' ')[0] || ''
      const lastName = name.trim().split(' ').slice(1).join(' ') || ''
      await register(email.trim().toLowerCase(), password, firstName, lastName, role)
      try {
        await fetch('/api/auth/registration-ip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        })
      } catch {
        // ignora falha
      }
      toast.success('Conta criada! Entre para continuar.')
      router.push(getRegistrationNextUrl(role))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h1 className="text-2xl font-bold text-white">Criar conta</h1>
      <p className="mt-2 text-slate-400">Escolha como deseja utilizar o CerejaVIP.</p>

      {!role ? (
        <>
          <RegistrationRoleChooser onSelect={selectRole} />
          <p className="mt-6 text-center text-sm text-slate-400">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300">
              Entrar
            </Link>
          </p>
          <p className="mt-2 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-white">
              ← Voltar ao início
            </Link>
          </p>
        </>
      ) : (
      <>
      <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-300">
              Tipo selecionado
            </p>
            <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold text-white">
              {role === 'advertiser' ? (
                <Sparkles className="h-5 w-5 text-primary-400" />
              ) : (
                <Heart className="h-5 w-5 text-sky-300" />
              )}
              {ROLE_COPY[role].label}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {ROLE_COPY[role].description}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {ROLE_COPY[role].nextStep}
            </p>
          </div>
          <button
            type="button"
            onClick={resetRole}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Trocar tipo de conta
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Seu nome"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="seu@email.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Senha</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 py-3 pl-4 pr-10 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Confirmar senha</label>
          <div className="relative mt-1">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 py-3 pl-4 pr-10 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Repita a senha"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 rounded border-slate-600"
          />
          <span className="text-sm text-slate-400">
            Li e aceito os{' '}
            <Link href="/termos" className="text-primary-400 hover:underline">
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link href="/privacidade" className="text-primary-400 hover:underline">
              Política de Privacidade
            </Link>
          </span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-500 py-3 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
        >
          {loading ? 'Criando conta...' : ROLE_COPY[role].title}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Já tem conta?{' '}
        <Link href="/login" className="text-primary-400 hover:text-primary-300">
          Entrar
        </Link>
      </p>
      <p className="mt-2 text-center">
        <Link href="/" className="text-sm text-slate-500 hover:text-white">
          ← Voltar ao início
        </Link>
      </p>
      </>
      )}
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-slate-400">
          Carregando cadastro...
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  )
}
