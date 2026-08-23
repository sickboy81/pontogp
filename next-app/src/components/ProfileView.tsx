'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, Flag, Heart, ImageIcon, MessageCircle, Phone, Send, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useFavoritesStore } from '@/store/favorites'
import type { Profile } from '@/lib/types'
import { formatPrice } from '@/utils/format'
import Lightbox from '@/components/Lightbox'
import StoryViewer, { type StoryItem } from '@/components/StoryViewer'
import toast from 'react-hot-toast'
import { telegramContactHref, whatsAppContactHref } from '@/lib/contact-prefill'
import { getProfileContactVisibilityState } from '@/lib/profile-contact-visibility.mjs'
import { DEFAULT_INTERNAL_MESSAGES_NOTICE } from '@/lib/internal-messages-settings.mjs'
import ProfileHero from '@/components/profile/ProfileHero'
import ProfileSummary from '@/components/profile/ProfileSummary'
import ProfileActions from '@/components/profile/ProfileActions'
import ProfileSections from '@/components/profile/ProfileSections'

interface ProfileViewProps {
  profile: Profile
  profileUrl: string
  openStories?: boolean
  /** Abre o viewer nesse story (URL partilhada: ?story=...) */
  initialStoryId?: string
}

interface PublicInternalMessagesSettings {
  loaded: boolean
  enabled: boolean
  notice: string
}

export default function ProfileView({
  profile,
  profileUrl,
  openStories = false,
  initialStoryId,
}: ProfileViewProps) {
  const user = useAuthStore((s) => s.user)
  const isFavorite = useFavoritesStore((s) => s.isFavorite(profile.id))
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite)
  const fetchFavorites = useFavoritesStore((s) => s.fetchFavorites)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [stories, setStories] = useState<StoryItem[]>([])
  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const [storyStartIndex, setStoryStartIndex] = useState(0)
  const [storiesLoaded, setStoriesLoaded] = useState(false)
  const canMessage = user && user.id !== profile.user_id
  // A denúncia deve estar disponível também para visitantes sem conta.
  const canReport = !user || user.id !== profile.user_id
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportEmail, setReportEmail] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [messagesSettings, setMessagesSettings] = useState<PublicInternalMessagesSettings>({
    loaded: false,
    enabled: true,
    notice: '',
  })
  const photos = profile.photos?.length ? profile.photos : (profile.thumbnail ? [profile.thumbnail] : [])

  useEffect(() => {
    if (user) void fetchFavorites()
  }, [user, fetchFavorites])

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('Entre na sua conta para salvar favoritos.')
      return
    }
    const ok = await toggleFavorite(profile.id)
    if (ok) toast.success(isFavorite ? 'Perfil removido dos favoritos.' : 'Perfil salvo nos favoritos.')
    else toast.error('Não foi possível atualizar os favoritos.')
  }

  const tagChipClass =
    'inline-block rounded-lg border border-transparent bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200 transition hover:border-primary-500/40 hover:bg-slate-600/80 hover:text-white'

  useEffect(() => {
    if (!profile.id) return
    fetch(`/api/stories?profileId=${encodeURIComponent(profile.id)}`)
      .then((r) => r.json())
      .then((data: StoryItem[]) => {
        setStories(Array.isArray(data) ? data : [])
        setStoriesLoaded(true)
      })
      .catch(() => {
        setStories([])
        setStoriesLoaded(true)
      })
  }, [profile.id])

  useEffect(() => {
    const shouldOpen = openStories || Boolean(initialStoryId)
    if (!shouldOpen || !storiesLoaded || stories.length === 0) return
    const idx = initialStoryId ? stories.findIndex((s) => s.id === initialStoryId) : 0
    setStoryStartIndex(idx >= 0 ? idx : 0)
    setStoryViewerOpen(true)
  }, [openStories, initialStoryId, storiesLoaded, stories])

  useEffect(() => {
    if (!profile.id) return
    fetch(`/api/profiles/${profile.id}/view`, { method: 'POST' }).catch(() => {})
  }, [profile.id])

  const trackClick = useCallback(
    (
      contactType:
        | 'whatsapp'
        | 'telegram'
        | 'phone'
        | 'message'
        | 'instagram'
        | 'twitter'
        | 'privacy'
        | 'onlyfans'
    ) => {
    if (!profile.id) return
    fetch(`/api/profiles/${profile.id}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactType }),
    }).catch(() => {})
  }, [profile.id])

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${profile.name} - CerejaVIP`,
        url: profileUrl,
        text: `${profile.name}, ${profile.city} - CerejaVIP`,
      }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(profileUrl).then(() => toast.success('Link copiado!'))
    }
  }

  const reportReasons = [
    { value: 'Conteúdo inadequado', label: 'Conteúdo inadequado' },
    { value: 'Spam', label: 'Spam' },
    { value: 'Dados falsos', label: 'Dados falsos' },
    { value: 'Outro', label: 'Outro' },
  ]

  const handleReportSubmit = async () => {
    setReportSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          reason: reportReason || 'Outro',
          description: reportDescription.trim(),
          email: reportEmail.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { error?: string }).error || 'Erro ao enviar denúncia')
        return
      }
      toast.success('Denúncia enviada. Obrigado.')
      setReportOpen(false)
      setReportReason('')
      setReportDescription('')
      setReportEmail('')
    } finally {
      setReportSubmitting(false)
    }
  }

  const { contactExpired, canStartMessage } =
    getProfileContactVisibilityState(profile.contact_expires_at)
  const isUnavailable = profile.is_unavailable === true
  const visibleWhatsapp = profile.show_whatsapp !== false ? (profile.whatsapp ?? '') : ''
  const visibleTelegram = profile.show_telegram !== false ? (profile.telegram ?? '') : ''
  const visiblePhone = profile.show_phone !== false ? (profile.phone ?? '') : ''

  const priceItems: { label: string; value: number }[] = []
  if (profile.price_30min) priceItems.push({ label: '30 min', value: profile.price_30min })
  if (profile.price_1h) priceItems.push({ label: '1h', value: profile.price_1h })
  if (profile.price_2h) priceItems.push({ label: '2h', value: profile.price_2h })
  if (profile.price_overnight) priceItems.push({ label: 'Pernoite', value: profile.price_overnight })
  if (profile.prices?.length) {
    profile.prices.forEach((p) => priceItems.push({ label: p.description, value: p.price }))
  }

  const hasMobileContactBar = !contactExpired && !!(visibleWhatsapp || visibleTelegram || visiblePhone)
  const shouldLoadMessagesSettings = Boolean(canMessage && canStartMessage && !contactExpired)
  const canOpenMessageThread =
    shouldLoadMessagesSettings &&
    messagesSettings.loaded &&
    messagesSettings.enabled
  const messagesNotice =
    messagesSettings.notice || DEFAULT_INTERNAL_MESSAGES_NOTICE

  useEffect(() => {
    if (!shouldLoadMessagesSettings) return

    let active = true

    fetch('/api/internal-messages-settings', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erro ao carregar configuração')
        const data = (await res.json()) as Partial<PublicInternalMessagesSettings>
        if (!active) return
        const enabled = data.enabled !== false
        const notice =
          typeof data.notice === 'string' && data.notice.trim()
            ? data.notice.trim()
            : enabled
              ? ''
              : DEFAULT_INTERNAL_MESSAGES_NOTICE
        setMessagesSettings({ loaded: true, enabled, notice })
      })
      .catch(() => {
        if (!active) return
        setMessagesSettings({ loaded: true, enabled: true, notice: '' })
      })

    return () => {
      active = false
    }
  }, [shouldLoadMessagesSettings])

  return (
    <div className={`profile-detail-page mx-auto max-w-7xl px-4 py-8 ${hasMobileContactBar ? 'pb-28 md:pb-8' : ''}`}>
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/70 bg-slate-900/70 p-4 shadow-[0_30px_80px_rgba(2,6,23,0.45)] sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(190,24,93,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_24%)]" />
        <div className="relative mb-8 flex flex-col gap-6 lg:flex-row lg:items-start">
          <ProfileHero
            profile={profile}
            photos={photos}
            unavailable={isUnavailable}
            hasStories={stories.length > 0}
            onOpenStory={() => {
              setStoryStartIndex(0)
              setStoryViewerOpen(true)
            }}
            onOpenPhoto={(index) => {
              setLightboxIndex(index)
              setLightboxOpen(true)
            }}
          />
          <div className="flex-1 space-y-6">
            <ProfileSummary
              profile={profile}
              unavailable={isUnavailable}
              tagChipClass={tagChipClass}
              priceItems={priceItems}
            />
            <ProfileActions
              profile={profile}
              profileUrl={profileUrl}
              canMessage={!!canMessage}
              canStartMessage={canStartMessage}
              contactExpired={contactExpired}
              canOpenMessageThread={canOpenMessageThread}
              messagesLoaded={messagesSettings.loaded}
              messagesEnabled={messagesSettings.enabled}
              messagesNotice={messagesNotice}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              visibleWhatsapp={visibleWhatsapp}
              visibleTelegram={visibleTelegram}
              visiblePhone={visiblePhone}
              onShare={handleShare}
              onTrackClick={trackClick}
            />
            <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/65 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Estatísticas públicas</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-3 text-center">
                  <Eye className="mx-auto h-4 w-4 text-primary-300" />
                  <p className="mt-1 text-lg font-bold text-white">{(profile.views || 0).toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Visualizações</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-3 text-center">
                  <Heart className="mx-auto h-4 w-4 text-red-300" />
                  <p className="mt-1 text-lg font-bold text-white">{(profile.favorites_count || 0).toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Favoritos</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-3 text-center">
                  <ImageIcon className="mx-auto h-4 w-4 text-amber-300" />
                  <p className="mt-1 text-lg font-bold text-white">{photos.length}</p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Fotos</p>
                </div>
              </div>
            </div>
            {canReport && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="profile-report-button inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200 transition hover:bg-amber-500/20 hover:text-amber-100"
                  aria-label="Denunciar perfil"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Denunciar perfil
                </button>
              </div>
            )}
          </div>
        </div>
        <ProfileSections
          profile={profile}
          photos={photos}
          unavailable={isUnavailable}
          onOpenPhoto={(index) => {
            setLightboxIndex(index)
            setLightboxOpen(true)
          }}
        />
      </div>

      {lightboxOpen && photos.length > 0 && (
        <Lightbox
          images={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(photos.length - 1, i + 1))}
        />
      )}

      {storyViewerOpen && stories.length > 0 && (
        <StoryViewer
          key={`${stories.map((s) => s.id).join('-')}-${storyStartIndex}`}
          stories={stories}
          initialIndex={storyStartIndex}
          onClose={() => setStoryViewerOpen(false)}
          canReport={!!canReport}
        />
      )}

      {reportOpen && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            onClick={() => !reportSubmitting && setReportOpen(false)}
            aria-hidden
          />
          <div className="fixed left-1/2 top-1/2 z-[90] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Denunciar anúncio</h3>
              <button
                type="button"
                onClick={() => !reportSubmitting && setReportOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Descreva o motivo da denúncia. Nossa equipe analisará em breve.
            </p>
            <div className="space-y-4">
              {!user && (
                <div>
                  <label htmlFor="report-email" className="mb-1 block text-xs font-medium text-slate-500">
                    E-mail para acompanhamento <span className="text-amber-300">*</span>
                  </label>
                  <input
                    id="report-email"
                    type="email"
                    required
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Motivo <span className="text-amber-300">*</span></label>
                <select
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecione</option>
                  {reportReasons.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Descrição <span className="text-amber-300">*</span></label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Detalhes adicionais..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => !reportSubmitting && setReportOpen(false)}
                disabled={reportSubmitting}
                className="flex-1 rounded-lg bg-slate-700 py-2.5 font-medium text-slate-300 transition hover:bg-slate-600 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReportSubmit}
                disabled={reportSubmitting}
                className="flex-1 rounded-lg bg-amber-600 py-2.5 font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
              >
                {reportSubmitting ? 'Enviando...' : 'Enviar denúncia'}
              </button>
            </div>
          </div>
        </>
      )}
      {hasMobileContactBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700 bg-slate-900/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-4xl grid-cols-3 gap-2 rounded-[1.35rem] border border-slate-700 bg-slate-950/40 p-2">
            {visibleWhatsapp ? (
              <a
                href={whatsAppContactHref(visibleWhatsapp, profileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick('whatsapp')}
                className="flex min-h-12 items-center justify-center rounded-xl bg-green-600 px-2 py-2 text-xs font-semibold text-white"
              >
                WhatsApp
              </a>
            ) : (
              <span
                aria-label="WhatsApp indisponível"
                title="WhatsApp indisponível"
                className="flex min-h-12 items-center justify-center rounded-xl bg-slate-800/70 px-2 py-2 text-slate-500"
              >
                <MessageCircle aria-hidden="true" className="h-5 w-5 opacity-60" />
              </span>
            )}
            {visibleTelegram ? (
              <a
                href={telegramContactHref(visibleTelegram, profileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick('telegram')}
                className="flex min-h-12 items-center justify-center rounded-xl bg-sky-600 px-2 py-2 text-xs font-semibold text-white"
              >
                Telegram
              </a>
            ) : (
              <span
                aria-label="Telegram indisponível"
                title="Telegram indisponível"
                className="flex min-h-12 items-center justify-center rounded-xl bg-slate-800/70 px-2 py-2 text-slate-500"
              >
                <Send aria-hidden="true" className="h-5 w-5 opacity-60" />
              </span>
            )}
            {visiblePhone ? (
              <a
                href={`tel:${visiblePhone}`}
                onClick={() => trackClick('phone')}
                className="flex min-h-12 items-center justify-center rounded-xl bg-slate-600 px-2 py-2 text-xs font-semibold text-white"
              >
                Ligar
              </a>
            ) : (
              <span
                aria-label="Telefone indisponível"
                title="Telefone indisponível"
                className="flex min-h-12 items-center justify-center rounded-xl bg-slate-800/70 px-2 py-2 text-slate-500"
              >
                <Phone aria-hidden="true" className="h-5 w-5 opacity-60" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
