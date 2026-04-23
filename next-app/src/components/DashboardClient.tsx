'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Plus, Edit, Eye, ImagePlus, Loader2, Calendar, BarChart3, ArrowUp, Zap, AlertTriangle, CreditCard } from 'lucide-react'
import VerificationRequestForm from '@/components/VerificationRequestForm'
import type { Profile } from '@/lib/types'
import { formatPrice } from '@/utils/format'
import toast from 'react-hot-toast'

function formatExpiresAt(iso: string | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysUntil(iso: string | undefined): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
}

export default function DashboardClient() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [storyUploading, setStoryUploading] = useState(false)
  const [bumpLoading, setBumpLoading] = useState(false)
  const [dailyBumps, setDailyBumps] = useState(0)
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/profiles/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch(() => {
        if (!cancelled) setProfile(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!profile) return
    fetch('/api/plans?enabledOnly=true', { cache: 'no-store' })
      .then((r) => r.json())
      .then(
        (plans: { id?: string; slug: string; name?: string; daily_bumps?: number }[]) => {
          const ref = (profile?.plan ?? 'gratis').toLowerCase()
          const byId = profile?.plan
            ? plans.find((p) => p.id === profile.plan)
            : undefined
          const bySlug = plans.find((p) => p.slug?.toLowerCase() === ref)
          const plan = byId ?? bySlug
          setDailyBumps(plan?.daily_bumps ?? 0)
          setCurrentPlanName(
            plan?.name ?? (ref === 'gratis' || ref === 'free' ? 'Grátis' : profile?.plan || ref)
          )
        }
      )
      .catch(() => {})
  }, [profile])

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-white">Dashboard</h1>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-700" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-700" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-700" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-white">Dashboard</h1>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
          <User className="mx-auto mb-4 h-16 w-16 text-slate-500" />
          <p className="mb-2 text-lg text-slate-300">Você ainda não tem um perfil de anúncio.</p>
          <p className="mb-6 text-slate-400">Crie seu perfil para aparecer na busca.</p>
          <Link
            href="/dashboard/perfil"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-500"
          >
            <Plus className="h-5 w-5" />
            Criar perfil
          </Link>
        </div>
      </div>
    )
  }

  const price = profile.price_30min ?? profile.price_1h ?? profile.prices?.[0]?.price ?? 0
  const searchDays = daysUntil(profile.search_expires_at)
  const contactDays = daysUntil(profile.contact_expires_at)
  const searchExpired = searchDays !== null && searchDays <= 0
  const contactExpired = contactDays !== null && contactDays <= 0
  const hasAnyExpirationIssue = searchExpired || contactExpired

  const handleToggleOnline = async () => {
    if (!profile) return
    try {
      const res = await fetch(`/api/profiles/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          is_online: !profile.is_online,
          online_until: !profile.is_online ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ') : null,
        }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      setProfile({ ...profile, is_online: !profile.is_online })
      toast.success(profile.is_online ? 'Você está offline' : 'Você está online')
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const todayStr = new Date().toLocaleDateString('fr-ca', { timeZone: 'America/Sao_Paulo' })
  const bumpsUsedToday =
    (profile as { bumps_used_date?: string; bumps_used_today?: number })?.bumps_used_date === todayStr
      ? ((profile as { bumps_used_today?: number })?.bumps_used_today ?? 0)
      : 0
  const bumpsRemaining = Math.max(0, dailyBumps - bumpsUsedToday)

  const handleBump = async () => {
    if (!profile || bumpLoading || bumpsRemaining <= 0) return
    setBumpLoading(true)
    try {
      const res = await fetch('/api/profiles/me/bump', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { error?: string }).error || 'Erro ao subir anúncio')
        return
      }
      toast.success('Anúncio subido! Você aparece no topo da lista.')
      const updated = await fetch('/api/profiles/me', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null))
      if (updated) setProfile(updated)
    } finally {
      setBumpLoading(false)
    }
  }

  const handleToggleAutoBump = async () => {
    if (!profile) return
    try {
      const res = await fetch(`/api/profiles/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ auto_bump: !profile.auto_bump }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      setProfile({ ...profile, auto_bump: !profile.auto_bump })
      toast.success(profile.auto_bump ? 'Subida automática desligada' : 'Subida automática ligada')
    } catch {
      toast.error('Erro ao atualizar')
    }
  }

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setStoryUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('profileId', profile.id)
      const res = await fetch('/api/stories/create', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Erro ao enviar story')
      }
      e.target.value = ''
    } catch (err) {
      console.error(err)
    } finally {
      setStoryUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Dashboard</h1>
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        <div className="flex items-center gap-4 p-6">
          {profile.thumbnail ? (
            <img
              src={profile.thumbnail}
              alt={profile.name}
              className="h-24 w-24 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-700 text-3xl font-bold text-slate-400">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold text-white">{profile.name}</h2>
            <p className="text-slate-400">
              {profile.city}, {profile.state} • {profile.category} • {profile.gender}
            </p>
            {price > 0 && (
              <p className="mt-1 text-sm text-slate-300">{formatPrice(price)}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap border-t border-slate-700">
          <Link
            href={`/perfil/${profile.id}`}
            className="flex flex-1 min-w-[120px] items-center justify-center gap-2 border-r border-slate-700 py-4 text-slate-300 transition hover:bg-slate-700/30 hover:text-white"
          >
            <Eye className="h-5 w-5" />
            Ver perfil
          </Link>
          <Link
            href="/dashboard/perfil"
            className="flex flex-1 min-w-[120px] items-center justify-center gap-2 border-r border-slate-700 py-4 text-slate-300 transition hover:bg-slate-700/30 hover:text-white"
          >
            <Edit className="h-5 w-5" />
            Editar perfil
          </Link>
          <Link
            href="/planos"
            className="flex flex-1 min-w-[120px] items-center justify-center gap-2 border-r border-slate-700 py-4 text-slate-300 transition hover:bg-slate-700/30 hover:text-white"
          >
            <CreditCard className="h-5 w-5" />
            Alterar plano
          </Link>
          <label className="flex flex-1 min-w-[120px] cursor-pointer items-center justify-center gap-2 py-4 text-slate-300 transition hover:bg-slate-700/30 hover:text-white">
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              onChange={handleStoryUpload}
              disabled={storyUploading}
            />
            {storyUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            Nova story
          </label>
        </div>
      </div>

      {/* Plano atual */}
      {currentPlanName && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Plano atual</p>
            <p className="text-lg font-semibold text-white">{currentPlanName}</p>
          </div>
          <Link
            href="/planos"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            <CreditCard className="h-4 w-4" />
            Alterar ou renovar plano
          </Link>
        </div>
      )}

      {/* Expiração */}
      {(profile.search_expires_at || profile.contact_expires_at) && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <Calendar className="h-4 w-4" />
            Expiração do anúncio
          </h3>
          {hasAnyExpirationIssue ? (
            <div className="flex flex-col gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-amber-200 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-sm">
                  {searchExpired && contactExpired
                    ? 'Seu anúncio e seus contatos expiraram. Renove seu plano para reativar tudo.'
                    : searchExpired
                      ? 'Seu anúncio não aparece na busca. Renove seu plano para voltar a aparecer.'
                      : 'Seu contato está indisponível. Renove seu plano para voltar a receber contatos.'}
                </p>
              </div>
              <Link
                href="/planos"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
              >
                <CreditCard className="h-4 w-4" />
                Renovar plano
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 text-sm">
              {profile.search_expires_at && (
                <p className="text-slate-300">
                  <span className="text-slate-500">Na busca:</span>{' '}
                  {searchDays !== null && searchDays > 0 ? `${searchDays} dia(s) restantes` : '—'} ({formatExpiresAt(profile.search_expires_at)})
                </p>
              )}
              {profile.contact_expires_at && (
                <p className="text-slate-300">
                  <span className="text-slate-500">Contato:</span>{' '}
                  {contactExpired ? 'Expirado' : contactDays !== null && contactDays > 0 ? `${contactDays} dia(s)` : '—'} ({formatExpiresAt(profile.contact_expires_at)})
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estatísticas + Online + Auto bump */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </h3>
          <div className="flex gap-6 text-sm">
            <span className="text-slate-300"><strong className="text-white">{profile.views ?? 0}</strong> visualizações</span>
            <span className="text-slate-300"><strong className="text-white">{profile.clicks ?? 0}</strong> cliques</span>
            <span className="text-slate-300"><strong className="text-white">{profile.favorites_count ?? 0}</strong> favoritos</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Status</h3>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleToggleOnline}
              className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm transition hover:bg-slate-700"
            >
              <span className={`h-2 w-2 rounded-full ${profile.is_online ? 'animate-pulse bg-green-400' : 'bg-slate-500'}`} />
              {profile.is_online ? 'Online' : 'Offline'}
            </button>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={!!profile.auto_bump}
                onChange={handleToggleAutoBump}
                className="rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500"
              />
              Subida automática
            </label>
          </div>
        </div>
      </div>

      {/* Subidas (bumps) */}
      {dailyBumps > 0 && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <ArrowUp className="h-4 w-4" />
            Subir anúncio
          </h3>
          <p className="mb-3 text-sm text-slate-300">
            Você tem <strong className="text-white">{bumpsRemaining}</strong> subida(s) restante(s) hoje (máx. {dailyBumps}/dia).
          </p>
          <button
            type="button"
            onClick={handleBump}
            disabled={bumpLoading || bumpsRemaining <= 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bumpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Subir anúncio agora
          </button>
        </div>
      )}

      <div className="mt-6">
        <VerificationRequestForm
          profile={profile}
          onSuccess={() => setProfile({ ...profile, verified: true })}
        />
      </div>
    </div>
  )
}
