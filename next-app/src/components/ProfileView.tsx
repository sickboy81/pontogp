'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MapPin, Share2, Phone, MessageCircle, Flag, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import type { Profile } from '@/lib/types'
import { formatPrice } from '@/utils/format'
import Lightbox from '@/components/Lightbox'
import StoryViewer, { type StoryItem } from '@/components/StoryViewer'
import ProfileMap from '@/components/ProfileMap'
import ProfileImageWithWatermark from '@/components/ProfileImageWithWatermark'
import toast from 'react-hot-toast'

interface ProfileViewProps {
  profile: Profile
  profileUrl: string
  openStories?: boolean
}

export default function ProfileView({ profile, profileUrl, openStories = false }: ProfileViewProps) {
  const user = useAuthStore((s) => s.user)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [stories, setStories] = useState<StoryItem[]>([])
  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const canMessage = user && user.id !== profile.user_id
  const canReport = user && user.id !== profile.user_id
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const photos = profile.photos?.length ? profile.photos : (profile.thumbnail ? [profile.thumbnail] : [])

  useEffect(() => {
    if (!openStories || !profile.id) return
    fetch(`/api/stories?profileId=${encodeURIComponent(profile.id)}`)
      .then((r) => r.json())
      .then((data: StoryItem[]) => {
        if (data?.length) {
          setStories(data)
          setStoryViewerOpen(true)
        }
      })
      .catch(() => {})
  }, [openStories, profile.id])

  useEffect(() => {
    if (!profile.id) return
    fetch(`/api/profiles/${profile.id}/view`, { method: 'POST' }).catch(() => {})
  }, [profile.id])

  const trackClick = useCallback((contactType: 'whatsapp' | 'telegram' | 'phone' | 'message') => {
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
    !!profile.contact_expires_at && new Date(profile.contact_expires_at) <= new Date()

  const priceItems: { label: string; value: number }[] = []
  if (profile.price_30min) priceItems.push({ label: '30 min', value: profile.price_30min })
  if (profile.price_1h) priceItems.push({ label: '1h', value: profile.price_1h })
  if (profile.price_2h) priceItems.push({ label: '2h', value: profile.price_2h })
  if (profile.price_overnight) priceItems.push({ label: 'Pernoite', value: profile.price_overnight })
  if (profile.prices?.length) {
    profile.prices.forEach((p) => priceItems.push({ label: p.description, value: p.price }))
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <div className="mb-6 flex flex-col gap-6 sm:flex-row">
          <div className="shrink-0 space-y-4">
            <div className="aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg bg-slate-700">
              {profile.thumbnail ? (
                <ProfileImageWithWatermark
                  src={profile.thumbnail}
                  alt={profile.name}
                  className="h-full w-full rounded-lg"
                  imgClassName="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">Sem foto</div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.slice(0, 8).map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-600"
                  >
                    <ProfileImageWithWatermark
                      src={src}
                      alt=""
                      className="h-full w-full rounded-lg"
                      imgClassName="h-full w-full"
                      showWatermark={false}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                <p className="flex items-center gap-1 text-slate-400">
                  <MapPin className="h-4 w-4" />
                  {profile.city}, {profile.state} • {profile.age} anos
                  {(profile.hair_color || profile.body_type || profile.height || profile.weight || profile.breast_type) && (
                    <> • {[profile.hair_color, profile.body_type, profile.height ? `${profile.height} cm` : '', profile.weight, profile.breast_type].filter(Boolean).join(' • ')}</>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.verified && (
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                      Verificado
                    </span>
                  )}
                  {profile.category === 'massagista' && profile.certified && (
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                      Massagista certificada
                    </span>
                  )}
                  {profile.is_online && (
                    <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                      Online agora
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canReport && (
                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-slate-400 transition hover:bg-slate-700 hover:text-amber-400"
                    aria-label="Denunciar anúncio"
                  >
                    <Flag className="h-4 w-4" />
                    Denunciar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-slate-300 transition hover:bg-slate-700 hover:text-white"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </button>
              </div>
            </div>
            {profile.bio_title && (
              <h2 className="mt-4 text-lg font-semibold text-white">{profile.bio_title}</h2>
            )}
            {profile.bio && (
              <p className="mt-2 whitespace-pre-wrap text-slate-300">{profile.bio}</p>
            )}

            {((profile.services?.length ?? 0) > 0 || (profile.massage_types?.length ?? 0) > 0 || (profile.online_services?.length ?? 0) > 0) && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  {profile.category === 'massagista' ? 'Tipos de massagens' : profile.category === 'online' ? 'Serviços online' : 'Serviços oferecidos'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    ...(profile.services ?? []),
                    ...(profile.massage_types ?? []),
                    ...(profile.online_services ?? []),
                  ].map((s, i) => (
                    <span key={i} className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {(profile.payment_methods?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Formas de pagamento</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.payment_methods!.map((pm, i) => (
                    <span key={i} className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">{pm}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.category !== 'online' && (profile.neighborhoods?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Bairros / regiões</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.neighborhoods!.map((n, i) => (
                    <span key={i} className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">{n}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.category !== 'online' && (profile.service_locations?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Locais de atendimento</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.service_locations!.map((loc, i) => (
                    <span key={i} className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">{loc}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.category !== 'online' && (profile.service_to?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Atende a</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.service_to!.map((s, i) => (
                    <span key={i} className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {(profile.special_services?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  {profile.category === 'massagista' ? 'Final feliz' : 'Serviços especiais'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.special_services!.map((s, i) => (
                    <span key={i} className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.category === 'massagista' && (profile.other_services?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Outros serviços</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.other_services!.map((s, i) => (
                    <span key={i} className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.category === 'online' && (profile.for_sale?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Para vender</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.for_sale!.map((s, i) => (
                    <span key={i} className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.category === 'online' && (profile.virtual_fantasies?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Fantasias virtuais</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.virtual_fantasies!.map((s, i) => (
                    <span key={i} className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {(profile.height_exact || profile.pubis_type || profile.piercings || profile.tattoos || profile.smoker) && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Características</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.height_exact && <span className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">Altura: {profile.height_exact}</span>}
                  {profile.pubis_type && <span className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">Pubis: {profile.pubis_type}</span>}
                  {profile.piercings && <span className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">Piercing</span>}
                  {profile.tattoos && <span className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">Tatuagem</span>}
                  {profile.smoker && <span className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm text-slate-200">Fuma: {profile.smoker}</span>}
                </div>
              </div>
            )}

            {priceItems.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Preços</h3>
                <div className="flex flex-wrap gap-2">
                  {priceItems.map((item, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-slate-700/50 px-3 py-2 text-sm font-medium text-white"
                    >
                      {item.label}: {formatPrice(item.value)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.schedule && profile.schedule.filter((s) => s.enabled).length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Horários de atendimento</h3>
                <ul className="space-y-1.5 rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-sm">
                  {profile.schedule
                    .filter((s) => s.enabled)
                    .map((s) => {
                      const dayLabels: Record<string, string> = {
                        monday: 'Segunda',
                        tuesday: 'Terça',
                        wednesday: 'Quarta',
                        thursday: 'Quinta',
                        friday: 'Sexta',
                        saturday: 'Sábado',
                        sunday: 'Domingo',
                      }
                      const timeStr =
                        s.start_time && s.end_time
                          ? s.start_time === '00:00' && s.end_time === '23:59'
                            ? '24h'
                            : `${s.start_time} – ${s.end_time}`
                          : '–'
                      return (
                        <li key={s.day} className="flex justify-between text-slate-200">
                          <span>{dayLabels[s.day] ?? s.day}</span>
                          <span className="font-medium text-white">{timeStr}</span>
                        </li>
                      )
                    })}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {contactExpired ? (
                <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
                  Contato indisponível. O anúncio expirou.
                </p>
              ) : (
                <>
                  {canMessage && (
                    <Link
                      href={`/mensagens?with=${encodeURIComponent(profile.user_id)}`}
                      onClick={() => trackClick('message')}
                      className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Enviar mensagem
                    </Link>
                  )}
                  {profile.whatsapp && (
                    <a
                      href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick('whatsapp')}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}
                  {profile.telegram && (
                    <a
                      href={`https://t.me/${profile.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick('telegram')}
                      className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                    >
                      Telegram
                    </a>
                  )}
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      onClick={() => trackClick('phone')}
                      className="flex items-center gap-2 rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500"
                    >
                      <Phone className="h-4 w-4" />
                      Ligar
                    </a>
                  )}
                  {profile.onlyfans && (
                    <a
                      href={profile.onlyfans.startsWith('http') ? profile.onlyfans : `https://${profile.onlyfans}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-500"
                    >
                      OnlyFans
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Galeria</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {photos.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }}
                  className="aspect-[3/4] overflow-hidden rounded-lg border border-slate-600 bg-slate-700 transition hover:border-primary-500"
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {profile.videos?.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Vídeos</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {profile.videos.map((src, i) => (
                <div key={i} className="overflow-hidden rounded-lg bg-slate-800">
                  <video
                    src={src}
                    controls
                    className="w-full"
                    preload="metadata"
                    poster=""
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.audio && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Áudio de apresentação</h3>
            <div className="rounded-lg bg-slate-800 p-4">
              <audio src={profile.audio} controls className="w-full" />
            </div>
          </div>
        )}

        {profile.category !== 'online' && profile.location_lat != null && profile.location_lng != null && (
          <div className="mt-6">
            <ProfileMap
              lat={profile.location_lat}
              lng={profile.location_lng}
              city={profile.city}
              state={profile.state}
              approximate={profile.location_approximate}
            />
          </div>
        )}
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
          stories={stories}
          initialIndex={0}
          onClose={() => setStoryViewerOpen(false)}
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

      <p className="mt-6">
        <Link href="/" className="text-primary-500 hover:underline">
          ← Voltar à listagem
        </Link>
      </p>
    </div>
  )
}
