'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { getRegistrationNextUrl } from '@/lib/registration-flow.mjs'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuthStore()
  const [role, setRole] = useState<'user' | 'advertiser'>('advertiser')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      <p className="mt-2 text-slate-400">Escolha como deseja utilizar o CerejaVIP</p>

      <div className="mt-6 flex rounded-xl border border-slate-600 bg-slate-900/50 p-1">
        <button
          type="button"
          onClick={() => setRole('advertiser')}
          aria-pressed={role === 'advertiser'}
          className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
            role === 'advertiser'
              ? 'bg-primary-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sou Acompanhante
        </button>
        <button
          type="button"
          onClick={() => setRole('user')}
          aria-pressed={role === 'user'}
          className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
            role === 'user' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Sou Cliente
        </button>
      </div>

      <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm text-slate-300" aria-live="polite">
        {role === 'advertiser'
          ? 'Crie sua conta e depois complete seu anúncio com informações, contato e pelo menos 3 fotos para publicá-lo.'
          : 'Crie sua conta para favoritar perfis e usar os recursos disponíveis para clientes.'}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Nome *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder={role === 'advertiser' ? 'Nome de exibição' : 'Seu nome'}
            required
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
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
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
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white"
              aria-label={showConfirm ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
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
          {loading ? 'Criando conta...' : 'Criar conta'}
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
    </div>
  )
}
