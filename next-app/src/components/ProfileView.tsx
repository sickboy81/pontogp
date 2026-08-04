'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  Clock3,
  Flag,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import type { Profile } from '@/lib/types'
import type { ProfileJsonTagField } from '@/lib/api/profiles'
import { formatPrice } from '@/utils/format'
import Lightbox from '@/components/Lightbox'
import StoryViewer, { type StoryItem } from '@/components/StoryViewer'
import ProfileMap from '@/components/ProfileMap'
import ProfileImageWithWatermark from '@/components/ProfileImageWithWatermark'
import toast from 'react-hot-toast'
import { socialProfileHref } from '@/lib/social-links'
import { profileTagSearchPath } from '@/lib/profile-tag-search'
import { telegramContactHref, whatsAppContactHref } from '@/lib/contact-prefill'

interface ProfileViewProps {
  profile: Profile
  profileUrl: string
  openStories?: boolean
  /** Abre o viewer nesse story (URL partilhada: ?story=...) */
  initialStoryId?: string
}

const panelClass =
  'rounded-2xl border border-slate-700/70 bg-slate-900/55 shadow-[0_18px_55px_rgba(2,6,23,0.22)] backdrop-blur-sm'

function SectionTitle({ icon, eyebrow, title }: { icon: ReactNode; eyebrow: string; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary-500/25 bg-primary-500/10 text-primary-500">
        {icon}
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
    </div>
  )
}

function TagGroup({
  profile,
  title,
  field,
  items,
  formatLabel,
}: {
  profile: Profile
  title: string
  field: ProfileJsonTagField
  items?: string[]
  formatLabel?: (value: string) => string
}) {
  if (!items?.length) return null

  return (
    <section className={`${panelClass} p-5 transition duration-300 hover:border-slate-600/90`}>
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={`${field}-${item}`}
            href={profileTagSearchPath(profile, field, item)}
            className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-sm text-slate-200 transition duration-200 hover:-translate-y-0.5 hover:border-primary-500/50 hover:bg-primary-500/10 hover:text-white"
          >
            {formatLabel ? formatLabel(item) : item}
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function ProfileView({
  profile,
  profileUrl,
  openStories = false,
  initialStoryId,
}: ProfileViewProps) {
  const user = useAuthStore((s) => s.user)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [stories, setStories] = useState<StoryItem[]>([])
  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const [storyStartIndex, setStoryStartIndex] = useState(0)
  const [storiesLoaded, setStoriesLoaded] = useState(false)
  const canMessage = user && user.id !== profile.user_id
  const canReport = user && user.id !== profile.user_id
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const photos = profile.photos?.length ? profile.photos : (profile.thumbnail ? [profile.thumbnail] : [])

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
    } finally {
      setReportSubmitting(false)
    }
  }

  const contactExpired =
    profile.is_unavailable === true ||
    (!!profile.contact_expires_at && new Date(profile.contact_expires_at) <= new Date())
  const isUnavailable = profile.is_unavailable === true
  const visibleWhatsapp = profile.show_whatsapp !== false ? profile.whatsapp : ''
  const visibleTelegram = profile.show_telegram !== false ? profile.telegram : ''
  const visiblePhone = profile.show_phone !== false ? profile.phone : ''

  const priceItems: { label: string; value: number }[] = []
  if (profile.price_30min) priceItems.push({ label: '30 min', value: profile.price_30min })
  if (profile.price_1h) priceItems.push({ label: '1h', value: profile.price_1h })
  if (profile.price_2h) priceItems.push({ label: '2h', value: profile.price_2h })
  if (profile.price_overnight) priceItems.push({ label: 'Pernoite', value: profile.price_overnight })
  if (profile.prices?.length) {
    profile.prices.forEach((p) => priceItems.push({ label: p.description, value: p.price }))
  }

  const hasMobileContactBar = !contactExpired && !isUnavailable && !!(visibleWhatsapp || visibleTelegram || visiblePhone)
  const categoryLabel =
    profile.category === 'massagista'
      ? 'Massagista'
      : profile.category === 'online'
        ? 'Atendimento online'
        : 'Acompanhante'
  const availabilityLabel = profile.is_online ? 'Online agora' : 'Sob consulta'
  const profileTier = profile.plan_slug && profile.plan_slug !== 'gratis' ? 'Perfil premium' : 'Perfil CerejaVIP'
  const enabledSchedule = profile.schedule?.filter((item) => item.enabled) ?? []
  const characteristicItems = [
    profile.height_exact ? `Altura: ${profile.height_exact}` : null,
    profile.pubis_type ? `Pubis: ${profile.pubis_type}` : null,
    profile.piercings ? 'Piercing' : null,
    profile.tattoos ? 'Tatuagem' : null,
    profile.smoker ? `Fuma: ${profile.smoker}` : null,
  ].filter((item): item is string => Boolean(item))

  return (
    <div className={`relative mx-auto max-w-7xl overflow-hidden px-4 py-6 sm:px-6 sm:py-10 ${hasMobileContactBar ? 'pb-28 md:pb-10' : ''}`}>
      <div aria-hidden className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-primary-600/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-32 top-[32rem] h-80 w-80 rounded-full bg-rose-500/5 blur-3xl" />

      <article className="relative space-y-5 sm:space-y-6">
        <section className={`${panelClass} overflow-hidden p-3 profile-reveal sm:p-5`}>
          <div className="grid gap-5 lg:grid-cols-12 lg:gap-7">
            <div className="lg:col-span-5">
              <div className={`relative overflow-hidden rounded-2xl p-[2px] ${stories.length > 0 ? 'bg-gradient-to-br from-pink-500 via-primary-500 to-orange-400' : 'bg-slate-700'}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (stories.length > 0) {
                      setStoryStartIndex(0)
                      setStoryViewerOpen(true)
                    }
                  }}
                  className={`group relative block aspect-[4/5] w-full overflow-hidden rounded-[14px] bg-slate-800 text-left ${stories.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                  aria-label={stories.length > 0 ? 'Abrir Cereja Stories ativas' : 'Sem Cereja Stories ativas'}
                >
                  {profile.thumbnail ? (
                    <ProfileImageWithWatermark
                      src={profile.thumbnail}
                      alt={profile.name}
                      className="h-full w-full"
                      imgClassName={`h-full w-full transition duration-700 group-hover:scale-[1.025] ${isUnavailable ? 'blur-md grayscale' : ''}`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">Sem foto</div>
                  )}
                  <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                  {stories.length > 0 && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Cereja Stories
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 block p-5 sm:p-6">
                    <span className="mb-2 flex flex-wrap gap-2">
                      {profile.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                          <BadgeCheck className="h-3.5 w-3.5" /> Verificada
                        </span>
                      )}
                      {profile.is_online && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.18)]" />
                          Online agora
                        </span>
                      )}
                    </span>
                    <span className="block text-3xl font-bold tracking-tight text-white sm:text-4xl">{profile.name}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-200">
                      <MapPin className="h-4 w-4 text-primary-500" />
                      {profile.city}, {profile.state} · {profile.age} anos
                    </span>
                  </span>
                </button>
              </div>

              {photos.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {photos.slice(0, 8).map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      onClick={() => {
                        if (isUnavailable) return
                        setLightboxIndex(index)
                        setLightboxOpen(true)
                      }}
                      className="group relative h-16 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 transition hover:-translate-y-0.5 hover:border-primary-500 sm:h-20 sm:w-16"
                      aria-label={`Abrir foto ${index + 1}`}
                    >
                      <ProfileImageWithWatermark
                        src={src}
                        alt=""
                        className="h-full w-full"
                        imgClassName={`h-full w-full transition duration-300 group-hover:scale-105 ${isUnavailable ? 'blur-md grayscale' : ''}`}
                        showWatermark={false}
                      />
                    </button>
                  ))}
                  {photos.length > 8 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isUnavailable) return
                        setLightboxIndex(8)
                        setLightboxOpen(true)
                      }}
                      className="flex h-16 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 transition hover:border-primary-500 hover:text-white sm:h-20 sm:w-16"
                    >
                      +{photos.length - 8}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-col lg:col-span-7">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary-500">
                    <Sparkles className="h-4 w-4" /> {profileTier}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Informações atualizadas pela anunciante</p>
                </div>
                <div className="flex gap-2">
                  {canReport && (
                    <button
                      type="button"
                      onClick={() => setReportOpen(true)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-400"
                      aria-label="Denunciar anúncio"
                    >
                      <Flag className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 px-3 text-sm font-medium text-slate-300 transition hover:border-primary-500/50 hover:bg-primary-500/10 hover:text-white"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Compartilhar</span>
                  </button>
                </div>
              </div>

              <div className="mt-5 grid flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_14rem]">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Apresentação</p>
                  <h1 className="sr-only">{profile.name}, {categoryLabel} em {profile.city}</h1>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {profile.bio_title || `${profile.name}, prazer em conhecer você`}
                  </h2>
                  {profile.bio && (
                    <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-300">{profile.bio}</p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {profile.verified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                        <ShieldCheck className="h-4 w-4" /> Identidade verificada
                      </span>
                    )}
                    {profile.category === 'massagista' && profile.certified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                        <BadgeCheck className="h-4 w-4" /> Massagista certificada
                      </span>
                    )}
                  </div>
                </div>

                <aside className="rounded-2xl border border-slate-700/70 bg-slate-950/35 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Resumo rápido</p>
                    <UserRound className="h-4 w-4 text-primary-500" />
                  </div>
                  <dl className="divide-y divide-slate-800">
                    <div className="py-3 first:pt-0">
                      <dt className="text-[10px] uppercase tracking-wider text-slate-500">Cidade</dt>
                      <dd className="mt-1 text-sm font-semibold text-white">{profile.city}</dd>
                    </div>
                    <div className="py-3">
                      <dt className="text-[10px] uppercase tracking-wider text-slate-500">Idade</dt>
                      <dd className="mt-1 text-sm font-semibold text-white">{profile.age} anos</dd>
                    </div>
                    <div className="py-3">
                      <dt className="text-[10px] uppercase tracking-wider text-slate-500">Categoria</dt>
                      <dd className="mt-1 text-sm font-semibold text-white">{categoryLabel}</dd>
                    </div>
                    <div className="pb-0 pt-3">
                      <dt className="text-[10px] uppercase tracking-wider text-slate-500">Disponibilidade</dt>
                      <dd className={`mt-1 text-sm font-semibold ${profile.is_online ? 'text-emerald-400' : 'text-white'}`}>{availabilityLabel}</dd>
                    </div>
                  </dl>
                </aside>
              </div>

              {isUnavailable && (
                <p className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Perfil indisponível no momento. As fotos ficam desfocadas até a renovação do anúncio.
                </p>
              )}

              {canMessage && !contactExpired && (
                <Link
                  href={`/mensagens?with=${encodeURIComponent(profile.user_id)}`}
                  onClick={() => trackClick('message')}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-500 md:hidden"
                >
                  <MessageCircle className="h-4 w-4" /> Enviar mensagem interna
                </Link>
              )}

              <div className="mt-5 hidden rounded-2xl border border-slate-700/70 bg-slate-950/35 p-4 md:block">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Contato direto</p>
                    <p className="mt-1 text-sm text-slate-300">Escolha o canal que preferir</p>
                  </div>
                  <MessageCircle className="h-5 w-5 text-primary-500" />
                </div>
                {contactExpired ? (
                  <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    {isUnavailable ? 'Contato temporariamente indisponível.' : 'Contato indisponível. O anúncio expirou.'}
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {canMessage && (
                      <Link href={`/mensagens?with=${encodeURIComponent(profile.user_id)}`} onClick={() => trackClick('message')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-500">
                        <MessageCircle className="h-4 w-4" /> Mensagem
                      </Link>
                    )}
                    {visibleWhatsapp && (
                      <a href={whatsAppContactHref(visibleWhatsapp, profileUrl)} target="_blank" rel="noopener noreferrer" onClick={() => trackClick('whatsapp')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-green-500">
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    )}
                    {visibleTelegram && (
                      <a href={telegramContactHref(visibleTelegram, profileUrl)} target="_blank" rel="noopener noreferrer" onClick={() => trackClick('telegram')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500">
                        Telegram
                      </a>
                    )}
                    {visiblePhone && (
                      <a href={`tel:${visiblePhone}`} onClick={() => trackClick('phone')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-600">
                        <Phone className="h-4 w-4" /> Ligar
                      </a>
                    )}
                  </div>
                )}
              </div>

              {!contactExpired && !isUnavailable && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {socialProfileHref(profile.instagram, 'instagram') && <a href={socialProfileHref(profile.instagram, 'instagram')!} target="_blank" rel="noopener noreferrer" onClick={() => trackClick('instagram')} className="rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1.5 text-xs font-semibold text-pink-300 transition hover:bg-pink-500/20">Instagram</a>}
                  {socialProfileHref(profile.twitter, 'twitter') && <a href={socialProfileHref(profile.twitter, 'twitter')!} target="_blank" rel="noopener noreferrer" onClick={() => trackClick('twitter')} className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700">X (Twitter)</a>}
                  {socialProfileHref(profile.privacy, 'privacy') && <a href={socialProfileHref(profile.privacy, 'privacy')!} target="_blank" rel="noopener noreferrer" onClick={() => trackClick('privacy')} className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-300 transition hover:bg-orange-500/20">Privacy</a>}
                  {socialProfileHref(profile.onlyfans, 'onlyfans') && <a href={socialProfileHref(profile.onlyfans, 'onlyfans')!} target="_blank" rel="noopener noreferrer" onClick={() => trackClick('onlyfans')} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20">OnlyFans</a>}
                </div>
              )}
            </div>
          </div>
        </section>

        {priceItems.length > 0 && (
          <section className={`${panelClass} profile-reveal p-5 sm:p-6`}>
            <SectionTitle icon={<WalletCards className="h-4 w-4" />} eyebrow="Valores e formatos" title="Escolha a duração do encontro" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {priceItems.map((item, index) => (
                <div key={`${item.label}-${index}`} className="rounded-2xl border border-slate-700/70 bg-slate-800/65 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary-500/40">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-lg font-bold text-white">{formatPrice(item.value)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TagGroup profile={profile} title="Serviços oferecidos" field="services" items={profile.services} />
          <TagGroup profile={profile} title="Tipos de massagens" field="massage_types" items={profile.massage_types} />
          <TagGroup profile={profile} title="Serviços online" field="online_services" items={profile.online_services} />
          <TagGroup profile={profile} title="Formas de pagamento" field="payment_methods" items={profile.payment_methods} />
          {profile.category !== 'online' && <TagGroup profile={profile} title="Bairros e regiões" field="neighborhoods" items={profile.neighborhoods} />}
          {profile.category !== 'online' && <TagGroup profile={profile} title="Locais de atendimento" field="service_locations" items={profile.service_locations} formatLabel={(value) => value === 'Hotel' ? 'Hotel/Motel' : value} />}
          {profile.category !== 'online' && <TagGroup profile={profile} title="Atende a" field="service_to" items={profile.service_to} />}
          <TagGroup profile={profile} title={profile.category === 'massagista' ? 'Final feliz' : 'Serviços especiais'} field="special_services" items={profile.special_services} />
          {profile.category === 'massagista' && <TagGroup profile={profile} title="Outros serviços" field="other_services" items={profile.other_services} />}
          {profile.category === 'online' && <TagGroup profile={profile} title="Para vender" field="for_sale" items={profile.for_sale} />}
          {profile.category === 'online' && <TagGroup profile={profile} title="Fantasias virtuais" field="virtual_fantasies" items={profile.virtual_fantasies} />}

          {characteristicItems.length > 0 && (
            <section className={`${panelClass} p-5 transition duration-300 hover:border-slate-600/90`}>
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Características</h3>
              <div className="flex flex-wrap gap-2">
                {characteristicItems.map((item) => <span key={item} className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-sm text-slate-200">{item}</span>)}
              </div>
            </section>
          )}

          {enabledSchedule.length > 0 && (
            <section className={`${panelClass} p-5 md:col-span-2 lg:col-span-1`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Horários de atendimento</h3>
                <Clock3 className="h-4 w-4 text-primary-500" />
              </div>
              <ul className="divide-y divide-slate-800 text-sm">
                {enabledSchedule.map((item) => {
                  const dayLabels: Record<string, string> = { monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo' }
                  const time = item.start_time && item.end_time ? item.start_time === '00:00' && item.end_time === '23:59' ? '24h' : `${item.start_time} – ${item.end_time}` : '–'
                  return <li key={item.day} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"><span className="text-slate-400">{dayLabels[item.day] ?? item.day}</span><span className="font-semibold text-white">{time}</span></li>
                })}
              </ul>
            </section>
          )}
        </div>

        {photos.length > 0 && (
          <section className={`${panelClass} profile-reveal p-5 sm:p-6`}>
            <SectionTitle icon={<Sparkles className="h-4 w-4" />} eyebrow="Galeria" title={`${photos.length} ${photos.length === 1 ? 'foto publicada' : 'fotos publicadas'}`} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((src, index) => (
                <button
                  key={`${src}-gallery-${index}`}
                  type="button"
                  onClick={() => {
                    if (isUnavailable) return
                    setLightboxIndex(index)
                    setLightboxOpen(true)
                  }}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 transition duration-300 hover:-translate-y-1 hover:border-primary-500/70 hover:shadow-[0_18px_35px_rgba(185,28,28,0.14)]"
                  aria-label={`Ampliar foto ${index + 1}`}
                >
                  <ProfileImageWithWatermark src={src} alt="" className="h-full w-full" imgClassName={`h-full w-full transition duration-500 group-hover:scale-[1.035] ${isUnavailable ? 'blur-md grayscale' : ''}`} />
                </button>
              ))}
            </div>
          </section>
        )}

        {(profile.videos?.length > 0 || profile.audio) && (
          <div className="grid gap-5 lg:grid-cols-2">
            {profile.videos?.length > 0 && (
              <section className={`${panelClass} p-5 sm:p-6 ${profile.audio ? '' : 'lg:col-span-2'}`}>
                <SectionTitle icon={<Play className="h-4 w-4" />} eyebrow="Conteúdo exclusivo" title="Vídeos" />
                <div className={`grid gap-4 ${profile.videos.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                  {profile.videos.map((src, index) => <video key={`${src}-${index}`} src={src} controls className="w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950" preload="metadata" />)}
                </div>
              </section>
            )}
            {profile.audio && (
              <section className={`${panelClass} p-5 sm:p-6`}>
                <SectionTitle icon={<MessageCircle className="h-4 w-4" />} eyebrow="Conheça minha voz" title="Áudio de apresentação" />
                <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4"><audio src={profile.audio} controls className="w-full" /></div>
              </section>
            )}
          </div>
        )}

        {profile.category !== 'online' && profile.location_lat != null && profile.location_lng != null && (
          <section className={`${panelClass} overflow-hidden p-5 sm:p-6`}>
            <ProfileMap lat={profile.location_lat} lng={profile.location_lng} city={profile.city} state={profile.state} approximate={profile.location_approximate} />
          </section>
        )}
      </article>

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
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Motivo</label>
                <select
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
                <label className="mb-1 block text-xs font-medium text-slate-500">Descrição (opcional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
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

      <div className="relative mt-6 border-t border-slate-800 pt-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-primary-500">
          <span aria-hidden>←</span> Voltar à listagem
        </Link>
      </div>

      {hasMobileContactBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700/80 bg-slate-950/95 px-3 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-16px_40px_rgba(2,6,23,0.42)] backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-4xl gap-2">
            {visibleWhatsapp && (
              <a
                href={whatsAppContactHref(visibleWhatsapp, profileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick('whatsapp')}
                className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 px-2 py-2.5 text-xs font-semibold text-white"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {visibleTelegram && (
              <a
                href={telegramContactHref(visibleTelegram, profileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick('telegram')}
                className="flex min-w-0 flex-1 items-center justify-center rounded-xl bg-sky-600 px-2 py-2.5 text-xs font-semibold text-white"
              >
                Telegram
              </a>
            )}
            {visiblePhone && (
              <a
                href={`tel:${visiblePhone}`}
                onClick={() => trackClick('phone')}
                className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-700 px-2 py-2.5 text-xs font-semibold text-white"
              >
                <Phone className="h-4 w-4" /> Ligar
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
