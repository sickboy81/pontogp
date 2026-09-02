'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  User,
  Plus,
  Edit,
  Eye,
  ImagePlus,
  Loader2,
  Calendar,
  BarChart3,
  ArrowUp,
  Zap,
  AlertTriangle,
  CreditCard,
  Trash2,
  Heart,
  MessageCircle,
  X,
  Clock3,
  RefreshCw,
  Link2,
} from 'lucide-react'
import VerificationRequestForm from '@/components/VerificationRequestForm'
import type { Profile } from '@/lib/types'
import { formatPrice, parsePocketBaseDateInput } from '@/utils/format'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'
import { getProfileOnboardingState } from '@/lib/profile-onboarding.mjs'
import { isProfileBumpEligible } from '@/lib/profile-bump-eligibility.mjs'
import { CEREJA_STORIES_DURATION_HOURS } from '@/lib/cereja-stories.mjs'
import { resolveProtectedAccess } from '@/lib/protected-access.mjs'
import { isProfileEffectivelyOnline } from '@/lib/profile-presence.mjs'
import { isAdvertiserRole } from '@/lib/advertiser-profile-access.mjs'

function formatExpiresAt(iso: string | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function todaySaoPauloDateKey(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${byType.year}-${byType.month}-${byType.day}`
}

function formatExpiresAtDateTime(iso: string | undefined): string | null {
  if (!iso) return null
  const d = parsePocketBaseDateInput(iso) ?? new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

type MyStoryRow = {
  id: string
  type: string
  text: string
  file: string
  created?: string
  expires_at?: string
  views: number
  active: boolean
  likesCount: number
  commentsCount: number
}

/** Texto de expiração no dashboard (inclui stories antigos sem `expires_at` no PB). */
function storyExpiresLine(s: MyStoryRow, durationHours: number): { main: string; hint?: string } {
  if (s.expires_at && String(s.expires_at).trim() !== '') {
    const t = formatExpiresAtDateTime(s.expires_at)
    if (t) return { main: `Até ${t}` }
  }
  const c = s.created != null && String(s.created).trim() !== '' ? parsePocketBaseDateInput(s.created) : null
  if (c) {
    const end = new Date(c.getTime() + durationHours * 60 * 60 * 1000)
    if (!isNaN(end.getTime())) {
      return {
        main: `Até ${end.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        hint: `calculado (regra: ${durationHours}h após a publicação)`,
      }
    }
  }
  return { main: `Fica visível ${durationHours}h após publicar` }
}

const STORY_CAPTION_MAX = 2000
const ONLINE_DURATION_OPTIONS = [1, 2, 4, 6, 8, 12, 24] as const

function normalizeOnlineUntil(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function isVideoFile(f: File): boolean {
  const t = (f.type || '').toLowerCase()
  if (t.startsWith('video/')) return true
  const ext = (f.name.split('.').pop() || '').toLowerCase()
  return ['mp4', 'webm', 'mov', 'm4v'].includes(ext)
}

export default function DashboardClient() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [authHydrated, setAuthHydrated] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [storyUploading, setStoryUploading] = useState(false)
  const [storyDraft, setStoryDraft] = useState<{
    file: File
    previewUrl: string
    isVideo: boolean
  } | null>(null)
  const [storyCaption, setStoryCaption] = useState('')
  const storyFileInputRef = useRef<HTMLInputElement | null>(null)
  const [myStories, setMyStories] = useState<MyStoryRow[]>([])
  const [storiesLoading, setStoriesLoading] = useState(false)
  const [storyDeletingId, setStoryDeletingId] = useState<string | null>(null)
  const [editingStory, setEditingStory] = useState<{ id: string; text: string } | null>(null)
  const [storySaveLoading, setStorySaveLoading] = useState(false)
  const [onlineDurationHours, setOnlineDurationHours] = useState<number>(24)
  const [bumpLoading, setBumpLoading] = useState(false)
  const [dailyBumps, setDailyBumps] = useState(0)
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const isAdvertiser = isAdvertiserRole(user?.role)

  useEffect(() => {
    const persistence = useAuthStore.persist
    if (persistence.hasHydrated()) setAuthHydrated(true)
    return persistence.onFinishHydration(() => setAuthHydrated(true))
  }, [])

  useEffect(() => {
    let cancelled = false
    const access = resolveProtectedAccess({ hydrated: authHydrated, authenticated: isAuthenticated })
    if (access === 'loading') return
    if (access === 'login') {
      setProfile(null)
      setLoadError(null)
      setLoading(false)
      return
    }
    if (!isAdvertiser) {
      setProfile(null)
      setLoadError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    fetch('/api/profiles/me', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar o perfil')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(undefined)
          setLoadError('Não foi possível carregar seu dashboard agora.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [authHydrated, isAuthenticated, isAdvertiser, reloadKey])

  useEffect(() => {
    if (!profile) return
    fetch('/api/plans?enabledOnly=true')
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

  const loadMyStories = () => {
    setStoriesLoading(true)
    fetch('/api/stories/mine', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: MyStoryRow[] }) => {
        setMyStories(Array.isArray(data.items) ? data.items : [])
      })
      .catch(() => setMyStories([]))
      .finally(() => setStoriesLoading(false))
  }

  useEffect(() => {
    if (!profile?.id) return
    loadMyStories()
  }, [profile?.id])

  useEffect(() => {
    if (!profile?.id || !profile.is_online) return

    if (!profile.online_until) return

    const deadline = parsePocketBaseDateInput(profile.online_until) ?? new Date(profile.online_until)
    if (Number.isNaN(deadline.getTime())) {
      setProfile((current) => {
        if (!current || current.id !== profile.id || current.is_online === false) return current
        return { ...current, is_online: false }
      })
      return
    }

    const remainingMs = deadline.getTime() - Date.now()
    if (remainingMs <= 0) {
      setProfile((current) => {
        if (!current || current.id !== profile.id || current.is_online === false) return current
        return { ...current, is_online: false }
      })
      return
    }

    const timer = window.setTimeout(() => {
      setProfile((current) => {
        if (!current || current.id !== profile.id) return current
        return isProfileEffectivelyOnline(current.is_online, current.online_until)
          ? { ...current, is_online: false }
          : current
      })
    }, remainingMs + 250)

    return () => window.clearTimeout(timer)
  }, [profile?.id, profile?.is_online, profile?.online_until])

  const closeStoryCompose = useCallback(() => {
    setStoryDraft((d) => {
      if (d) URL.revokeObjectURL(d.previewUrl)
      return null
    })
    setStoryCaption('')
    if (storyFileInputRef.current) storyFileInputRef.current.value = ''
  }, [])

  const handleStoryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setStoryDraft((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      const previewUrl = URL.createObjectURL(file)
      return { file, previewUrl, isVideo: isVideoFile(file) }
    })
    setStoryCaption('')
    e.target.value = ''
  }

  const submitStoryCompose = async () => {
    if (!profile || !storyDraft) return
    setStoryUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', storyDraft.file)
      fd.append('profileId', profile.id)
      const cap = storyCaption.trim()
      if (cap) fd.append('text', cap.slice(0, STORY_CAPTION_MAX))
      const res = await fetch('/api/stories/create', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Erro ao enviar Cereja Story')
      }
      toast.success(
        `Cereja Story publicada! Fica visível ${CEREJA_STORIES_DURATION_HOURS}h (home e perfil) e some depois disso.`
      )
      closeStoryCompose()
      loadMyStories()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar Cereja Story'
      toast.error(msg)
    } finally {
      setStoryUploading(false)
    }
  }

  useEffect(() => {
    if (!storyDraft) return
    const onK = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !storyUploading) closeStoryCompose()
    }
    window.addEventListener('keydown', onK)
    return () => window.removeEventListener('keydown', onK)
  }, [storyDraft, storyUploading, closeStoryCompose])

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

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-white">Dashboard</h1>
        <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-300" />
          <p className="text-lg font-semibold text-white">Seu dashboard não carregou</p>
          <p className="mt-2 text-sm text-slate-300">{loadError} Verifique sua conexão e tente novamente.</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-white transition hover:bg-primary-500"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    if (!isAdvertiser) {
      const firstName = user?.first_name || user?.name?.split(' ')[0] || 'você'
      return (
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold text-white">Minha conta</h1>
          <p className="mt-2 text-slate-400">Olá, {firstName}. Aqui você encontra seus acessos como cliente.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/anunciantes" className="rounded-xl border border-primary-500/40 bg-primary-500/10 p-5 transition hover:bg-primary-500/15">
              <Eye className="h-6 w-6 text-primary-300" />
              <h2 className="mt-4 font-semibold text-white">Explorar anunciantes</h2>
              <p className="mt-1 text-sm text-slate-300">Encontre perfis por cidade e categoria.</p>
            </Link>
            <Link href="/favoritos" className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 transition hover:border-slate-500 hover:bg-slate-800">
              <Heart className="h-6 w-6 text-rose-300" />
              <h2 className="mt-4 font-semibold text-white">Meus favoritos</h2>
              <p className="mt-1 text-sm text-slate-400">Reveja os perfis que você salvou.</p>
            </Link>
            <Link href="/mensagens" className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 transition hover:border-slate-500 hover:bg-slate-800">
              <MessageCircle className="h-6 w-6 text-sky-300" />
              <h2 className="mt-4 font-semibold text-white">Mensagens</h2>
              <p className="mt-1 text-sm text-slate-400">Acompanhe suas conversas.</p>
            </Link>
            <Link href="/conta" className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 transition hover:border-slate-500 hover:bg-slate-800">
              <User className="h-6 w-6 text-emerald-300" />
              <h2 className="mt-4 font-semibold text-white">Dados da conta</h2>
              <p className="mt-1 text-sm text-slate-400">Gerencie suas informações e preferências.</p>
            </Link>
          </div>
        </div>
      )
    }
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

  if (profile.status === 'inactive') {
    const onboardingState = getProfileOnboardingState(profile)
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-white">Dashboard</h1>
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white">Seu perfil está em rascunho</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                Conclua o próximo passo abaixo. O anúncio só aparecerá nas buscas depois da revisão e publicação.
              </p>
              {onboardingState.pendingLabels.length > 0 ? (
                <ul className="mt-3 space-y-1 text-sm text-slate-200">
                  {onboardingState.pendingLabels.map((label) => <li key={label}>• Falta {label}</li>)}
                </ul>
              ) : (
                <p className="mt-3 text-sm font-medium text-emerald-300">Tudo preenchido. Revise e publique seu anúncio.</p>
              )}
              <Link
                href={onboardingState.href}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-white transition hover:bg-primary-500"
              >
                {onboardingState.firstPending === 'photos' ? <ImagePlus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                {onboardingState.actionLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const price = profile.price_30min ?? profile.price_1h ?? profile.prices?.[0]?.price ?? 0
  const searchDays = daysUntil(profile.search_expires_at)
  const contactDays = daysUntil(profile.contact_expires_at)
  const viewsN = profile.views ?? 0
  const clicksN = profile.clicks ?? 0
  const statsCtr = viewsN > 0 ? Math.round((clicksN / viewsN) * 1000) / 10 : null
  const statsFavRate =
    viewsN > 0 ? Math.round(((profile.favorites_count ?? 0) / viewsN) * 1000) / 10 : null
  const searchExpired = searchDays !== null && searchDays <= 0
  const contactExpired = contactDays !== null && contactDays <= 0
  const hasAnyExpirationIssue = searchExpired || contactExpired
  const bumpEligible = isProfileBumpEligible(profile)
  const activeStories = myStories.filter((s) => s.active)
  const inactiveStories = myStories.filter((s) => !s.active)
  const recentStoryCount = 3
  const recentStories = myStories.slice(0, recentStoryCount)
  const hiddenStoryCount = Math.max(0, myStories.length - recentStories.length)

  const handleToggleOnline = async () => {
    if (!profile) return
    const nextShouldBeOnline = !isProfileEffectivelyOnline(profile.is_online, profile.online_until)
    const requestedOnlineUntil = nextShouldBeOnline
      ? new Date(Date.now() + onlineDurationHours * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      : null

    try {
      const res = await fetch(`/api/profiles/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          is_online: nextShouldBeOnline,
          online_until: requestedOnlineUntil,
        }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')

      const updated = (await res.json().catch(() => ({}))) as {
        is_online?: boolean
        online_until?: string | null
      }
      const nextOnlineUntil = normalizeOnlineUntil(updated.online_until)
      const nextIsOnline = isProfileEffectivelyOnline(updated.is_online === true, nextOnlineUntil)

      setProfile({
        ...profile,
        is_online: nextIsOnline,
        online_until: nextOnlineUntil,
      })
      toast.success(
        nextIsOnline
          ? `Você está online por ${onlineDurationHours} hora${onlineDurationHours > 1 ? 's' : ''}`
          : nextShouldBeOnline
            ? 'Seu status online expirou.'
            : 'Você está offline'
      )
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const todayStr = todaySaoPauloDateKey()
  const bumpsUsedToday =
    (profile as { bumps_used_date?: string; bumps_used_today?: number })?.bumps_used_date === todayStr
      ? ((profile as { bumps_used_today?: number })?.bumps_used_today ?? 0)
      : 0
  const bumpsRemaining = Math.max(0, dailyBumps - bumpsUsedToday)

  const handleBump = async () => {
    if (!profile || !bumpEligible || bumpLoading || bumpsRemaining <= 0) return
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
    if (!profile || !bumpEligible) return
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

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Excluir esta Cereja Story? Não dá para desfazer.')) return
    setStoryDeletingId(id)
    try {
      const res = await fetch(`/api/stories/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { error?: string }).error || 'Erro ao excluir')
        return
      }
      toast.success('Cereja Story excluída.')
      setMyStories((prev) => prev.filter((s) => s.id !== id))
      if (editingStory?.id === id) setEditingStory(null)
    } finally {
      setStoryDeletingId(null)
    }
  }

  const handleSaveStoryText = async () => {
    if (!editingStory) return
    setStorySaveLoading(true)
    try {
      const res = await fetch(`/api/stories/${editingStory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: editingStory.text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { error?: string }).error || 'Erro ao salvar')
        return
      }
      const t = (data as { text?: string }).text ?? editingStory.text
      setMyStories((prev) => prev.map((s) => (s.id === editingStory.id ? { ...s, text: t } : s)))
      setEditingStory(null)
      toast.success('Texto atualizado.')
    } finally {
      setStorySaveLoading(false)
    }
  }

  return (
    <div className="advertiser-dashboard mx-auto w-full max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Dashboard</h1>

      {storyDraft && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-compose-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              if (!storyUploading) closeStoryCompose()
            }}
            aria-label="Fechar"
          />
          <div
            className="story-compose-modal relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-600 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div>
                <h2 id="story-compose-title" className="text-lg font-semibold text-white">
                  Nova Cereja Story
                </h2>
                <p className="mt-1 text-sm text-slate-200">
                  Fica visível <strong className="text-white">{CEREJA_STORIES_DURATION_HOURS} horas</strong> na
                  home e no seu perfil; depois some automaticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!storyUploading) closeStoryCompose()
                }}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="overflow-hidden rounded-xl bg-black">
                {storyDraft.isVideo ? (
                  <video
                    src={storyDraft.previewUrl}
                    className="max-h-[50vh] w-full object-contain"
                    controls
                    playsInline
                  />
                ) : (
                  <Image
                    src={storyDraft.previewUrl}
                    alt="Pré-visualização da Cereja Story"
                    width={900}
                    height={1200}
                    unoptimized
                    className="max-h-[50vh] w-full object-contain"
                  />
                )}
              </div>
              <label className="mt-3 block text-xs font-medium text-slate-500" htmlFor="story-caption">
                Legenda (opcional)
              </label>
              <textarea
                id="story-caption"
                value={storyCaption}
                onChange={(e) => setStoryCaption(e.target.value.slice(0, STORY_CAPTION_MAX))}
                rows={3}
                maxLength={STORY_CAPTION_MAX}
                placeholder="Escreva algo para acompanhar a Cereja Story…"
                className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                disabled={storyUploading}
              />
              <p className="mt-1 text-right text-xs text-slate-500">
                {storyCaption.length}/{STORY_CAPTION_MAX}
              </p>
            </div>
            <div className="flex gap-2 border-t border-slate-700 p-4">
              <button
                type="button"
                onClick={() => {
                  if (!storyUploading) closeStoryCompose()
                }}
                className="flex-1 rounded-xl border border-slate-600 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                disabled={storyUploading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitStoryCompose}
                disabled={storyUploading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:opacity-50"
              >
                {storyUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Publicar Cereja Story
              </button>
            </div>
          </div>
        </div>
      )}

      {hasAnyExpirationIssue && (
        <section className="mb-6 rounded-2xl border-2 border-red-500/70 bg-red-500/10 p-5 shadow-lg shadow-red-950/20" role="alert" aria-labelledby="expired-announcement-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-7 w-7 shrink-0 text-red-300" />
              <div>
                <h2 id="expired-announcement-title" className="text-lg font-bold text-white">Seu anúncio precisa ser renovado</h2>
                <p className="mt-1 text-sm leading-6 text-red-100">
                  {searchExpired && contactExpired
                    ? 'O anúncio saiu da busca e os contatos foram desativados porque o plano venceu.'
                    : searchExpired
                      ? 'Seu anúncio não aparece mais na busca porque o período de divulgação venceu.'
                      : 'Os contatos do seu anúncio foram desativados porque o período contratado venceu.'}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Renove agora para voltar a aparecer e receber contatos.</p>
              </div>
            </div>
            <Link href="/planos" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-500">
              <CreditCard className="h-5 w-5" />
              Renovar anúncio
            </Link>
          </div>
        </section>
      )}

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        <div className="flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:p-6">
          {profile.thumbnail ? (
            <Image
              src={profile.thumbnail}
              alt={profile.name}
              width={96}
              height={96}
              sizes="96px"
              className="h-20 w-20 rounded-xl object-cover sm:h-24 sm:w-24"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-700 text-3xl font-bold text-slate-400 sm:h-24 sm:w-24">
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
        <div className="grid grid-cols-2 border-t border-slate-700 sm:flex sm:flex-wrap">
          <Link
            href={`/perfil/${encodeURIComponent(profile.id)}`}
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
            href="/dashboard/perfil?tab=bio"
            className="flex min-w-[120px] flex-1 items-center justify-center gap-2 border-r border-slate-700 py-4 text-primary-300 transition hover:bg-primary-500/10 hover:text-primary-200"
          >
            <Link2 className="h-5 w-5" />
            Link na bio
          </Link>
          <Link
            href="/planos"
            className="flex flex-1 min-w-[120px] items-center justify-center gap-2 border-r border-slate-700 py-4 text-slate-300 transition hover:bg-slate-700/30 hover:text-white"
          >
            <CreditCard className="h-5 w-5" />
            Alterar plano
          </Link>
          <Link
            href="/pagamentos"
            className="flex flex-1 min-w-[120px] items-center justify-center gap-2 py-4 text-slate-300 transition hover:bg-slate-700/30 hover:text-white"
          >
            <CreditCard className="h-5 w-5" />
            Pagamentos
          </Link>
          <label className="flex flex-1 min-w-[120px] cursor-pointer items-center justify-center gap-2 py-4 text-slate-300 transition hover:bg-slate-700/30 hover:text-white">
            <input
              ref={storyFileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              onChange={handleStoryFileSelect}
              disabled={storyUploading}
            />
            {storyUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            Nova Cereja Story
          </label>
        </div>
      </div>
      <div
        className="mt-3 flex gap-2 rounded-lg border border-primary-500/35 bg-primary-500/10 px-3 py-2.5 text-sm text-slate-200"
        role="note"
      >
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary-300" aria-hidden />
        <p>
          <span className="font-medium text-white">Duração:</span> cada Cereja Story fica publicada na
          home e no perfil <strong className="text-white">{CEREJA_STORIES_DURATION_HOURS} horas</strong> a
          partir do envio, depois deixa de aparecer.
        </p>
      </div>

      {/* Os meus stories */}
      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <p className="mb-3 text-sm leading-relaxed text-slate-300">
          Para evitar uma lista gigante no dashboard, mostramos apenas as Cereja Stories mais recentes aqui.
          O histórico completo fica numa página separada.
        </p>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <ImagePlus className="h-4 w-4" />
            Minhas Cereja Stories
          </h3>
          <button
            type="button"
            onClick={loadMyStories}
            disabled={storiesLoading}
            className="text-xs font-medium text-primary-400 hover:underline disabled:opacity-50"
          >
            {storiesLoading ? 'A carregar…' : 'Atualizar lista'}
          </button>
        </div>
        {myStories.length > 0 && (
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <div className="advertiser-active-stat rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              <p className="text-lg font-bold text-emerald-200">{activeStories.length}</p>
              <p className="text-xs uppercase tracking-wider text-emerald-300/80">Ativas agora</p>
            </div>
            <div className="rounded-lg border border-slate-600 bg-slate-900/40 px-3 py-2">
              <p className="text-lg font-bold text-white">{inactiveStories.length}</p>
              <p className="text-xs uppercase tracking-wider text-slate-500">No histórico</p>
            </div>
            <div className="rounded-lg border border-slate-600 bg-slate-900/40 px-3 py-2">
              <p className="text-lg font-bold text-white">
                {myStories.reduce((sum, s) => sum + (Number(s.views) || 0), 0)}
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-500">Views totais</p>
            </div>
          </div>
        )}
        {storiesLoading && myStories.length === 0 ? (
          <div className="flex items-center gap-2 py-6 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando suas Cereja Stories…
          </div>
        ) : myStories.length === 0 ? (
          <p className="py-2 text-sm text-slate-400">
            Ainda não há Cereja Stories publicadas. Use &quot;Nova Cereja Story&quot; acima para publicar.
          </p>
        ) : (
          <>
            {hiddenStoryCount > 0 && (
              <p className="mb-3 rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-400">
                Mostrando as {recentStories.length} mais recentes. Existem mais {hiddenStoryCount} no histórico completo.
              </p>
            )}
            <ul className="space-y-3">
              {recentStories.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-600/80 bg-slate-900/40 p-3 sm:flex-row sm:items-stretch"
                >
                <div className="shrink-0 sm:w-24">
                  {s.file && s.type === 'video' ? (
                    <video
                      src={s.file}
                      className="h-28 w-full rounded-md object-cover sm:h-24 sm:w-24"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : s.file ? (
                    <Image
                      src={s.file}
                      alt=""
                      width={112}
                      height={112}
                      sizes="(max-width: 640px) 112px, 96px"
                      className="h-28 w-full rounded-md object-cover sm:h-24 sm:w-24"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-md bg-slate-700 text-xs text-slate-500 sm:h-24 sm:w-24">
                      Sem ficheiro
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded px-2 py-0.5 font-medium ${
                        s.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600 text-slate-300'
                      }`}
                    >
                      {s.active ? 'Ativa' : 'Expirada / inativa'}
                    </span>
                    <span className="text-slate-500">{s.type === 'video' ? 'Vídeo' : 'Imagem'}</span>
                    {(() => {
                      const { main, hint } = storyExpiresLine(s, CEREJA_STORIES_DURATION_HOURS)
                      return (
                        <span className="text-slate-400" title={hint || undefined}>
                          {main}
                        </span>
                      )
                    })()}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-1" title="Visualizações">
                      <Eye className="h-4 w-4 text-slate-500" />
                      {s.views}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Curtidas">
                      <Heart className="h-4 w-4 text-slate-500" />
                      {s.likesCount}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Comentários">
                      <MessageCircle className="h-4 w-4 text-slate-500" />
                      {s.commentsCount}
                    </span>
                  </div>
                  {editingStory?.id === s.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={editingStory.text}
                        onChange={(e) => setEditingStory({ ...editingStory, text: e.target.value })}
                        rows={3}
                        maxLength={2000}
                        className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Legenda da Cereja Story (opcional)"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleSaveStoryText}
                          disabled={storySaveLoading}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
                        >
                          {storySaveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Guardar texto
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStory(null)}
                          disabled={storySaveLoading}
                          className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {s.text ? (
                        <p className="mt-2 line-clamp-3 text-sm text-slate-300">{s.text}</p>
                      ) : (
                        <p className="mt-2 text-sm italic text-slate-500">Sem legenda</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link
                          href={`/perfil/${profile?.id}?stories=1&story=${encodeURIComponent(s.id)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-primary-500/50 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-200 hover:bg-primary-500/20"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Abrir story
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEditingStory({ id: s.id, text: s.text })}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Editar texto
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStory(s.id)}
                          disabled={storyDeletingId === s.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-sm text-red-200 hover:bg-red-950/50 disabled:opacity-50"
                        >
                          {storyDeletingId === s.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-center">
              <Link
                href="/dashboard/stories"
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Ver todas as Cereja Stories
              </Link>
            </div>
          </>
        )}
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
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-slate-300"><strong className="text-white">{viewsN}</strong> visualizações</span>
            <span className="text-slate-300"><strong className="text-white">{clicksN}</strong> cliques</span>
            <span className="text-slate-300">
              <strong className="text-white">{profile.favorites_count ?? 0}</strong> favoritos
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            CTR (cliques por visualização):{' '}
            <strong className="text-slate-400">
              {statsCtr != null ? `${statsCtr}%` : '—'}
            </strong>
            {statsFavRate != null && (
              <>
                {' '}
                · Favoritos / views: <strong className="text-slate-400">{statsFavRate}%</strong>
              </>
            )}
            . Mais detalhes em <Link href="/dashboard/perfil?tab=stats" className="text-primary-400 hover:underline">Perfil → Stats</Link>
            .
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Status</h3>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-slate-400">Duração online:</span>
              <select
                value={onlineDurationHours}
                onChange={(e) => setOnlineDurationHours(Number(e.target.value))}
                className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {ONLINE_DURATION_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {h}h
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleToggleOnline}
              className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm transition hover:bg-slate-700"
            >
              <span className={`h-2 w-2 rounded-full ${profile.is_online ? 'animate-pulse bg-green-400' : 'bg-slate-500'}`} />
              {profile.is_online ? 'Online' : 'Offline'}
            </button>
            <label className={`flex items-center gap-2 text-sm ${bumpEligible ? 'cursor-pointer text-slate-300' : 'cursor-not-allowed text-slate-500'}`}>
              <input
                type="checkbox"
                checked={bumpEligible && !!profile.auto_bump}
                onChange={handleToggleAutoBump}
                disabled={!bumpEligible}
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
            {bumpEligible ? (
              <>
                Você tem <strong className="text-white">{bumpsRemaining}</strong> subida(s) restante(s) hoje (máx. {dailyBumps}/dia).
              </>
            ) : (
              'As subidas estão desativadas porque o plano expirou. Renove o plano para reativá-las.'
            )}
          </p>
          <button
            type="button"
            onClick={handleBump}
            disabled={!bumpEligible || bumpLoading || bumpsRemaining <= 0}
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

