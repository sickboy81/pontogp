'use client'

import Link from 'next/link'
import { Heart, MessageCircle, Phone, Share2 } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { socialProfileHref } from '@/lib/social-links'
import { phoneContactHref, telegramContactHref, whatsAppContactHref } from '@/lib/contact-prefill'

type TrackableContactType =
  | 'whatsapp'
  | 'telegram'
  | 'phone'
  | 'message'
  | 'instagram'
  | 'twitter'
  | 'privacy'
  | 'onlyfans'

type ProfileActionsProps = {
  profile: Profile
  profileUrl: string
  canMessage: boolean
  canStartMessage: boolean
  contactExpired: boolean
  canOpenMessageThread: boolean
  messagesLoaded: boolean
  messagesEnabled: boolean
  messagesNotice: string
  visibleWhatsapp: string
  visibleTelegram: string
  visiblePhone: string
  onShare: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
  onTrackClick: (contactType: TrackableContactType) => void
}

export default function ProfileActions({
  profile,
  profileUrl,
  canMessage,
  canStartMessage,
  contactExpired,
  canOpenMessageThread,
  messagesLoaded,
  messagesEnabled,
  messagesNotice,
  visibleWhatsapp,
  visibleTelegram,
  visiblePhone,
  onShare,
  isFavorite,
  onToggleFavorite,
  onTrackClick,
}: ProfileActionsProps) {
  const whatsappHref = whatsAppContactHref(visibleWhatsapp, profileUrl)
  const telegramHref = telegramContactHref(visibleTelegram, profileUrl)
  const phoneHref = phoneContactHref(visiblePhone)
  const hasNetworks =
    !contactExpired &&
    (socialProfileHref(profile.instagram, 'instagram') ||
      socialProfileHref(profile.twitter, 'twitter') ||
      socialProfileHref(profile.privacy, 'privacy') ||
      socialProfileHref(profile.onlyfans, 'onlyfans'))

  return (
    <div className="profile-reveal space-y-4">
      <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/65 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Contato e ações
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Use os canais abaixo conforme a disponibilidade atual do anúncio.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${isFavorite ? 'border-red-400/50 bg-red-500/15 text-red-200' : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-400 text-red-400' : ''}`} />
              {isFavorite ? 'Favoritado' : 'Favoritar'}
            </button>
          <button
            type="button"
            onClick={onShare}
            className="rounded-full border border-slate-600 p-3 text-slate-300 transition hover:bg-slate-700 hover:text-white"
            aria-label="Compartilhar perfil"
          >
            <Share2 className="h-4 w-4" />
          </button>
          </div>
        </div>

        <div className="mt-4">
          {contactExpired ? (
            <p className="rounded-2xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Contato indisponível. O anúncio expirou.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {canStartMessage && canMessage && (
                canOpenMessageThread ? (
                  <Link
                    href={`/mensagens?with=${encodeURIComponent(profile.user_id)}`}
                    onClick={() => onTrackClick('message')}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-500"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar mensagem
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 opacity-80"
                    title={messagesLoaded ? messagesNotice : 'Verificando mensagens...'}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {messagesLoaded ? 'Mensagens indisponíveis' : 'Verificando mensagens...'}
                  </button>
                )
              )}
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrackClick('whatsapp')}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
              {telegramHref && (
                <a
                  href={telegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrackClick('telegram')}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  Telegram
                </a>
              )}
              {phoneHref && (
                <a
                  href={phoneHref}
                  onClick={() => onTrackClick('phone')}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-slate-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-500"
                >
                  <Phone className="h-4 w-4" />
                  Ligar
                </a>
              )}
            </div>
          )}
        </div>

        {canStartMessage && canMessage && messagesLoaded && !messagesEnabled && (
          <p className="mt-4 rounded-2xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {messagesNotice}
          </p>
        )}
      </div>

      {hasNetworks && (
        <div className="rounded-[1.75rem] border border-slate-700/70 bg-slate-900/65 p-5">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Redes sociais</h3>
          <div className="flex flex-wrap gap-2">
            {socialProfileHref(profile.instagram, 'instagram') && (
              <a
                href={socialProfileHref(profile.instagram, 'instagram')!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackClick('instagram')}
                className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-500"
              >
                Instagram
              </a>
            )}
            {socialProfileHref(profile.twitter, 'twitter') && (
              <a
                href={socialProfileHref(profile.twitter, 'twitter')!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackClick('twitter')}
                className="flex items-center gap-2 rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500"
              >
                X (Twitter)
              </a>
            )}
            {socialProfileHref(profile.privacy, 'privacy') && (
              <a
                href={socialProfileHref(profile.privacy, 'privacy')!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackClick('privacy')}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
              >
                Privacy
              </a>
            )}
            {socialProfileHref(profile.onlyfans, 'onlyfans') && (
              <a
                href={socialProfileHref(profile.onlyfans, 'onlyfans')!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackClick('onlyfans')}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400"
              >
                OnlyFans
              </a>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
