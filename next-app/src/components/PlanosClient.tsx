'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Star, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import type { Plan, Profile } from '@/lib/types'
import { formatPrice } from '@/utils/format'
import toast from 'react-hot-toast'
import PlanPaymentModal from '@/components/PlanPaymentModal'

type BillingPeriod = 'weekly' | 'monthly'
const PLAN_ORDER = ['gratis', 'bronze', 'prata', 'ouro', 'vip', 'premium']

function hasExpired(iso: string | undefined): boolean {
  if (!iso) return false
  const d = new Date(iso)
  if (isNaN(d.getTime())) return false
  return d.getTime() <= Date.now()
}

export default function PlanosClient() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [plans, setPlans] = useState<Plan[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(() => {
    if (typeof window === 'undefined') return 'weekly'
    return (localStorage.getItem('planos-billing-period') as BillingPeriod) || 'weekly'
  })
  const [paymentModal, setPaymentModal] = useState<{
    plan: Plan
    amount: number
    profile: Profile
  } | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const [plansRes, profilesRes] = await Promise.all([
          fetch('/api/plans?enabledOnly=true', { cache: 'no-store' }),
          isAuthenticated && user
            ? fetch('/api/profiles/me', { credentials: 'include' }).then((r) =>
                r.ok ? r.json() : null
              )
            : Promise.resolve(null),
        ])
        if (cancelled) return
        const plansData = (await plansRes.json()) as Plan[]
        const filter = (p: Plan) =>
          user?.role === 'user' || user?.role === '1'
            ? p.target_type === 'user'
            : (p.target_type === 'advertiser' || !p.target_type)
        const sorted = plansData.filter(filter).sort((a, b) => {
          const ai = PLAN_ORDER.indexOf(a.slug)
          const bi = PLAN_ORDER.indexOf(b.slug)
          if (ai === -1 && bi === -1) return (a.price_monthly || 0) - (b.price_monthly || 0)
          if (ai === -1) return 1
          if (bi === -1) return -1
          return ai - bi
        })
        setPlans(sorted)
        if (profilesRes) {
          setProfiles(Array.isArray(profilesRes) ? profilesRes : profilesRes ? [profilesRes] : [])
        }
      } catch (e) {
        if (!cancelled) toast.error('Erro ao carregar planos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('planos-billing-period', billingPeriod)
    }
  }, [billingPeriod])

  const getPrice = (plan: Plan) => {
    if (plan.slug === 'gratis') return 0
    return billingPeriod === 'weekly' ? (plan.price_weekly || 0) : (plan.price_monthly || 0)
  }

  const isGratis = (plan: Plan) => plan.slug === 'gratis'

  const applyPlanToProfile = async (profileId: string, plan: Plan): Promise<boolean> => {
    const tryPatch = async (planValue: string) =>
      fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: planValue }),
      })

    // Primeiro tenta formato novo (relation id).
    let res = await tryPatch(plan.id)
    if (res.ok) return true

    // Fallback para ambientes antigos que ainda usam slug.
    res = await tryPatch(plan.slug)
    return res.ok
  }

  const applyGratis = async (plan: Plan, profile: Profile) => {
    try {
      const ok = await applyPlanToProfile(profile.id, plan)
      if (!ok) throw new Error('Erro')
      toast.success(`Plano ${plan.name} ativado!`)
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Erro ao aplicar plano')
    }
  }

  const handleSelectPlan = (plan: Plan) => {
    if (!isAuthenticated) {
      toast.error('Faça login para assinar um plano')
      router.push(`/login?callbackUrl=${encodeURIComponent('/planos')}`)
      return
    }
    // Planos de anunciante: precisa de perfil
    const isAdvertiserPlan = plan.target_type === 'advertiser' || !plan.target_type
    if (isAdvertiserPlan && profiles.length === 0) {
      toast.error('Crie um perfil antes de assinar um plano.')
      router.push('/dashboard')
      return
    }
    const profile = profiles[0] ?? null
    if (isGratis(plan)) {
      if (profile) {
        applyGratis(plan, profile)
      } else {
        toast.error('Crie um perfil para usar o plano grátis.')
      }
      return
    }
    const amount = getPrice(plan)
    if (amount <= 0) return
    if (profile) {
      setPaymentModal({ plan, amount, profile })
    } else {
      toast.error('Crie um perfil antes de assinar um plano pago.')
    }
  }

  const handlePaymentSuccess = async () => {
    if (!paymentModal) return
    try {
      const ok = await applyPlanToProfile(paymentModal.profile.id, paymentModal.plan)
      if (!ok) {
        toast.error('Pagamento detectado, mas a renovação não foi aplicada automaticamente.')
        toast('Atualize a página ou aguarde o webhook concluir.')
        return
      }
      toast.success(`Plano ${paymentModal.plan.name} ativado!`)
      setPaymentModal(null)
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Erro ao confirmar plano')
    }
  }

  const formatLimit = (v: number | 'unlimited' | undefined) =>
    v === 'unlimited' || v === -1 ? 'Ilimitado' : String(v ?? 0)

  const handleApplyCoupon = async () => {
    const code = couponCode.trim()
    if (!code || couponApplying) return
    setCouponApplying(true)
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { error?: string }).error || 'Erro ao aplicar cupom')
        return
      }
      toast.success((data as { message?: string }).message || 'Cupom aplicado!')
      setCouponCode('')
      const profileRes = await fetch('/api/profiles/me', { credentials: 'include' })
      if (profileRes.ok) {
        const p = await profileRes.json()
        setProfiles(Array.isArray(p) ? p : p ? [p] : [])
      }
      router.refresh()
    } finally {
      setCouponApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold text-white">Planos e Preços</h1>
        <p className="mb-8 text-slate-400">Carregando planos...</p>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-white">Planos e Preços</h1>
      <p className="mb-8 text-slate-400">
        Escolha o plano ideal. Comece grátis ou assine para mais visibilidade.
      </p>

      {isAuthenticated && profiles.length > 0 && (() => {
        const currentProfile = profiles[0]
        const currentPlan = plans.find(
          (p) => p.id === currentProfile?.plan || p.slug.toLowerCase() === (currentProfile?.plan ?? '').toLowerCase()
        )
        const currentPlanExpired = hasExpired(currentProfile?.search_expires_at) || hasExpired(currentProfile?.contact_expires_at)
        return (
          <div className={`mb-6 rounded-xl p-4 ${currentPlanExpired ? 'border border-amber-500/50 bg-amber-500/10' : 'border border-primary-500/40 bg-primary-500/10'}`}>
            <p className="text-sm text-slate-400">Seu plano atual</p>
            <p className="text-lg font-semibold text-white">
              {currentPlan?.name ?? (currentProfile?.plan_slug || 'Grátis')}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {currentPlanExpired
                ? 'Seu plano expirou. Renove ou mude de plano para reativar o anúncio e os contatos.'
                : 'Para renovar ou mudar de plano, escolha um dos planos abaixo.'}
            </p>
          </div>
        )
      })()}

      {isAuthenticated && profiles.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <span className="text-sm text-slate-400">Tem um cupom?</span>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Código"
            maxLength={20}
            className="w-32 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={couponApplying || !couponCode.trim()}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {couponApplying ? (
              <>
                <Loader2 className="inline h-4 w-4 animate-spin" /> Aplicando...
              </>
            ) : (
              'Aplicar cupom'
            )}
          </button>
        </div>
      )}

      <div className="mb-8 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setBillingPeriod('weekly')}
          className={`rounded-lg px-4 py-2 font-medium transition ${
            billingPeriod === 'weekly'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Semanal
        </button>
        <button
          type="button"
          onClick={() => setBillingPeriod('monthly')}
          className={`rounded-lg px-4 py-2 font-medium transition ${
            billingPeriod === 'monthly'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Mensal
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = getPrice(plan)
          const currentProfile = profiles[0]
          const isCurrentPlan =
            plan.id === currentProfile?.plan || plan.slug.toLowerCase() === (currentProfile?.plan ?? '').toLowerCase()
          const currentPlanExpired = hasExpired(currentProfile?.search_expires_at) || hasExpired(currentProfile?.contact_expires_at)
          const canRenewCurrentPlan = isCurrentPlan && currentPlanExpired
          const disablePlanButton = isCurrentPlan && !canRenewCurrentPlan
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-xl border p-6 transition ${
                isCurrentPlan
                  ? 'border-primary-500 bg-primary-500/10 ring-2 ring-primary-500/50'
                  : 'border-slate-700 bg-slate-800/50 hover:border-primary-500/50'
              }`}
            >
              {isCurrentPlan && (
                <span className="mb-2 inline-flex items-center gap-1 rounded bg-primary-600/80 px-2 py-0.5 text-xs font-semibold text-white">
                  <Check className="h-3 w-3" /> Seu plano atual
                </span>
              )}
              {!isCurrentPlan && plan.slug === 'ouro' && (
                <span className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                  <Star className="h-3 w-3 fill-current" /> Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="mt-2 text-2xl font-bold text-primary-400">
                {price === 0 ? 'Grátis' : formatPrice(price)}
              </p>
              <p className="mb-4 text-xs text-slate-500">
                {billingPeriod === 'weekly' ? 'por semana' : 'por mês'}
              </p>
              <ul className="mb-6 flex-1 space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  {formatLimit(plan.max_photos)} fotos
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  {plan.daily_bumps || 0} bumps/dia
                </li>
                {plan.features.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => !disablePlanButton && handleSelectPlan(plan)}
                disabled={disablePlanButton}
                className={`w-full rounded-lg py-2.5 font-semibold text-white transition disabled:opacity-50 ${
                  disablePlanButton ? 'cursor-default bg-primary-600/80' : 'bg-primary-600 hover:bg-primary-500'
                }`}
              >
                {disablePlanButton
                  ? 'Plano atual'
                  : canRenewCurrentPlan
                    ? 'Renovar plano'
                    : isGratis(plan)
                      ? 'Ativar Grátis'
                      : 'Assinar ou renovar'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Precisa de um perfil?{' '}
        <Link href="/register" className="text-primary-500 hover:underline">
          Cadastre-se
        </Link>{' '}
        ou{' '}
        <Link href="/login" className="text-primary-500 hover:underline">
          faça login
        </Link>
        .
      </p>

      {paymentModal && (
        <PlanPaymentModal
          isOpen
          onClose={() => setPaymentModal(null)}
          planId={paymentModal.plan.id}
          planSlug={paymentModal.plan.slug}
          planName={`${paymentModal.plan.name} (${billingPeriod === 'weekly' ? 'Semanal' : 'Mensal'})`}
          amount={paymentModal.amount}
          profileId={paymentModal.profile.id}
          customerName={user?.first_name || user?.email}
          customerEmail={user?.email}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
