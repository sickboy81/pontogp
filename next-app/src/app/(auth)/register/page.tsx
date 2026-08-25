'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import RegistrationRoleChooser from '@/components/RegistrationRoleChooser'
import { parseRegistrationRole } from '@/lib/registration-role.mjs'
import { getRegistrationNextUrl } from '@/lib/registration-flow.mjs'

type RegistrationRole = 'user' | 'advertiser'

function getRegistrationErrorMessage(error: unknown) {
  const response = error as {
    data?: Record<string, { code?: string; message?: string }>
    response?: { data?: Record<string, { code?: string; message?: string }>; message?: string }
    message?: string
  }
  const fields = response.response?.data || response.data || {}
  const field = Object.entries(fields).find(([, value]) => value?.message)
  if (!field) {
    if (response.message === 'Failed to create record.') {
      return 'Não foi possível criar a conta. Confira se o email já não está cadastrado e revise os dados preenchidos.'
    }
    return response.response?.message || response.message || 'Erro ao criar conta'
  }

  const [name, detail] = field
  if (name === 'email' && detail.code === 'validation_not_unique') return 'Este email já está cadastrado. Use outro email ou entre na sua conta.'
  if (name === 'email' && detail.code === 'validation_is_email') return 'Informe um endereço de email válido.'
  if (name === 'password') return 'A senha não atende aos requisitos do cadastro.'
  if (name === 'passwordConfirm') return 'As senhas não coincidem.'
  return `${name}: ${detail.message}`
}

const ROLE_COPY: Record<
  RegistrationRole,
  {
    label: string
    title: string
  }
> = {
  advertiser: {
    label: 'Anunciante',
    title: 'Crie sua conta de anunciante',
  },
  user: {
    label: 'Cliente',
    title: 'Crie sua conta de cliente',
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isAdult, setIsAdult] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    setRole(parseRegistrationRole(searchParams.get('tipo')))
  }, [searchParams])

  const selectRole = (nextRole: RegistrationRole) => {
    setRole(nextRole)
    router.replace(`/register?tipo=${nextRole}`, { scroll: false })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!role) {
      toast.error('Escolha primeiro o tipo da conta')
      return
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    if (password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres')
      return
    }
    if (!isAdult) {
      toast.error('Confirme que você tem 18 anos ou mais para continuar')
      return
    }
    if (!acceptedTerms) {
      toast.error('Aceite os termos de uso para criar uma conta')
      return
    }
    try {
      setLoading(true)
      await register(email.trim().toLowerCase(), password, '', '', role)
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
      const message = getRegistrationErrorMessage(err)
      setSubmitError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-5">
      <h1 className="text-2xl font-bold text-white">Criar conta</h1>
      <p className="mt-1 text-sm text-slate-400">Escolha como deseja utilizar o CerejaVIP.</p>

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
      <div className="mt-3 grid grid-cols-2 rounded-xl border border-slate-600 bg-slate-900/50 p-1">
        <button type="button" onClick={() => selectRole('advertiser')} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${role === 'advertiser' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}>
          Sou Acompanhante
        </button>
        <button type="button" onClick={() => selectRole('user')} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${role === 'user' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>
          Sou Cliente
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
        {submitError && (
          <div role="alert" className="rounded-lg border border-red-400/70 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            {submitError}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
              className="w-full rounded-lg border border-slate-600 bg-slate-800 py-2 pl-3 pr-10 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Mínimo 8 caracteres"
              minLength={8}
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
              className="w-full rounded-lg border border-slate-600 bg-slate-800 py-2 pl-3 pr-10 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Repita a senha"
              minLength={8}
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
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
          <p className="font-medium text-slate-300">Requisitos da senha</p>
          <ul className="mt-1 space-y-0.5">
            <li className={password.length >= 8 ? 'text-emerald-400' : ''}>• Pelo menos 8 caracteres</li>
            <li className={password && password === confirmPassword ? 'text-emerald-400' : ''}>• A confirmação deve ser igual à senha</li>
          </ul>
        </div>
        <label className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900/30 px-3 py-2.5">
          <input
            type="checkbox"
            checked={isAdult}
            onChange={(e) => setIsAdult(e.target.checked)}
            className="mt-1 rounded border-slate-600"
            required
          />
          <span className="text-sm text-slate-300">Confirmo que tenho 18 anos ou mais.</span>
        </label>
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
          className="w-full rounded-lg bg-primary-500 py-2.5 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
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
