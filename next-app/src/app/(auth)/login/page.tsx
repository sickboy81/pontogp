'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getLoginErrorMessage, useAuthStore, isAdminRole } from '@/store/auth'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const { login, isAuthenticated, refresh } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (isAuthenticated) {
      const { user } = useAuthStore.getState()
      const role = user?.role
      const isAdmin = isAdminRole(role)
      router.replace(isAdmin ? '/admin' : callbackUrl)
    }
  }, [isAuthenticated, callbackUrl, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email?.trim() || !password) {
      toast.error('Preencha todos os campos')
      return
    }
    try {
      setLoading(true)
      await login(email.toLowerCase().trim(), password)
      toast.success('Login realizado com sucesso!')
      const { user } = useAuthStore.getState()
      const role = user?.role
      const isAdmin = isAdminRole(role)
      router.replace(isAdmin ? '/admin' : callbackUrl)
    } catch (err: unknown) {
      toast.error(getLoginErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h1 className="text-2xl font-bold text-white">Entrar</h1>
      <p className="mt-2 text-slate-400">Acesse sua conta do CerejaVIP</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="seu@email.com"
            autoComplete="email"
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
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-2 text-right">
            <Link href="/esqueci-senha" className="text-sm text-primary-400 hover:text-primary-300">
              Esqueci minha senha
            </Link>
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-500 py-3 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Não tem conta?{' '}
        <Link href="/register" className="text-primary-400 hover:text-primary-300">
          Criar conta
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-slate-400">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
