'use client'

import { useEffect, useCallback, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import type { Profile } from '@/lib/types'
import { socialProfileHref } from '@/lib/social-links'
import { buildContactPrefillMessage, phoneContactHref, telegramContactHref, whatsAppContactHref } from '@/lib/contact-prefill'
import { getProfileContactVisibilityState } from '@/lib/profile-contact-visibility.mjs'
import { DEFAULT_INTERNAL_MESSAGES_NOTICE } from '@/lib/internal-messages-settings.mjs'

interface LinkBioViewProps {
  profile: Profile
  profileUrl: string
}

interface PublicInternalMessagesSettings {
  loaded: boolean
  enabled: boolean
  notice: string
}

function bioLinkHref(url: string): string {
  const value = url.trim()
  if (/^(https?:|tel:|mailto:|sms:)/i.test(value)) return value
  return `https://${value}`
}

function withContactPrefillIfNeeded(url: string, profileUrl: string): string {
  const href = bioLinkHref(url)
  const text = buildContactPrefillMessage(profileUrl)
  const encodedText = new URLSearchParams({ text }).toString()

  try {
    const parsed = new URL(href)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
    const path = parsed.pathname
    const currentText = parsed.searchParams.get('text')?.trim()
    if (currentText) return href

    if (host === 'wa.me' && /^\/\d+\/?$/.test(path)) {
      parsed.searchParams.set('text', text)
      return parsed.toString()
    }

    if ((host === 'api.whatsapp.com' || host === 'web.whatsapp.com') && path === '/send') {
      parsed.searchParams.set('text', text)
      return parsed.toString()
    }

    if ((host === 't.me' || host === 'telegram.me') && /^\/[^/]+\/?$/.test(path)) {
      const joiner = parsed.search ? '&' : '?'
      return `${href}${joiner}${encodedText}`
    }
  } catch {
    // mantém href original se não for URL parseável
  }

  return href
}

function normalizeLinkUrl(url: string): string {
  const value = url.trim()
  if (!value) return ''
  if (/^(tel|mailto|sms):/i.test(value)) return value.replace(/\/+$/, '').toLowerCase()
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const parsed = new URL(withProtocol)
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}`.toLowerCase()
  } catch {
    return value.replace(/\/+$/, '').toLowerCase()
  }
}

/**
 * Visual compacto "link na bio": foto, nome, descrição e botões de contato.
 * Usado quando display_mode === 'link_bio' na rota por slug.
 */
export default function LinkBioView({ profile, profileUrl }: LinkBioViewProps) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const canMessage = user && user.id !== profile.user_id
  const [messagesSettings, setMessagesSettings] = useState<PublicInternalMessagesSettings>({
    loaded: false,
    enabled: true,
    notice: '',
  })

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

  const { contactExpired, canStartMessage, showCustomBioLinks } =
    getProfileContactVisibilityState(profile.contact_expires_at)
  const shouldLoadMessagesSettings = Boolean(canMessage && canStartMessage && !contactExpired)
  const isUnavailable =
    profile.is_unavailable === true || profile.visibility_mode === 'unavailable'
  const photos = profile.photos?.length ? profile.photos : (profile.thumbnail ? [profile.thumbnail] : [])
  const avatarIndex =
    profile.bio_avatar_index != null && profile.bio_avatar_index >= 0 && profile.bio_avatar_index < photos.length
      ? profile.bio_avatar_index
      : 0
  const thumbnail = photos[avatarIndex] || profile.thumbnail || profile.photos?.[0]
  const description = profile.short_description?.trim() || profile.bio_title?.trim() || (profile.bio ? profile.bio.slice(0, 120) + (profile.bio.length > 120 ? '...' : '') : '')
  const theme = ['light', 'minimal', 'sunset', 'cherry', 'ocean', 'lavender', 'emerald'].includes(profile.bio_theme || '') ? profile.bio_theme as string : 'dark'
  const richTheme = ['sunset', 'cherry', 'ocean', 'lavender', 'emerald'].includes(theme)
  const bioLinks = Array.isArray(profile.bio_links) ? profile.bio_links.filter((l) => l?.label && l?.url) : []
  const visibleBioLinks = showCustomBioLinks ? bioLinks : []
  const bioLinkUrls = new Set(visibleBioLinks.map((link) => normalizeLinkUrl(bioLinkHref(link.url))).filter(Boolean))
  const hasBioLink = (url: string | null | undefined) => {
    const normalized = normalizeLinkUrl(url || '')
    return normalized ? bioLinkUrls.has(normalized) : false
  }
  const visibleWhatsapp = profile.show_whatsapp !== false ? profile.whatsapp : ''
  const visibleTelegram = profile.show_telegram !== false ? profile.telegram : ''
  const visiblePhone = profile.show_phone !== false ? profile.phone : ''
  const whatsappHref = visibleWhatsapp ? whatsAppContactHref(visibleWhatsapp, profileUrl) : ''
  const telegramHref = visibleTelegram ? telegramContactHref(visibleTelegram, profileUrl) : ''
  const phoneHref = phoneContactHref(visiblePhone)
  const instagramHref = socialProfileHref(profile.instagram, 'instagram')
  const twitterHref = socialProfileHref(profile.twitter, 'twitter')
  const privacyHref = socialProfileHref(profile.privacy, 'privacy')
  const onlyfansHref = socialProfileHref(profile.onlyfans, 'onlyfans')
  const visibleSocialLinks = [
    instagramHref,
    twitterHref,
    privacyHref,
    onlyfansHref,
  ].filter((href) => href && !hasBioLink(href))
  const buttonColor = profile.bio_button_color?.trim()
  const linkButtonStyle = buttonColor ? { backgroundColor: buttonColor, borderColor: buttonColor, color: '#fff' } : undefined
  const defaultLinkButtonClass = theme === 'dark'
    ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
    : ['sunset', 'cherry', 'ocean', 'lavender', 'emerald'].includes(theme)
      ? 'border-white/40 bg-white/20 text-white hover:bg-white/30'
      : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
  const linkButtonClass = linkButtonStyle ? 'border text-white' : defaultLinkButtonClass
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
    <div className={`min-h-screen px-4 py-12 ${
      theme === 'light' ? 'bg-gradient-to-b from-slate-100 to-slate-200' :
      theme === 'minimal' ? 'bg-white' :
      theme === 'sunset' ? 'bg-gradient-to-br from-orange-400/90 via-rose-500/90 to-rose-700' :
      theme === 'cherry' ? 'bg-gradient-to-br from-rose-800 to-red-950' :
      theme === 'ocean' ? 'bg-gradient-to-br from-cyan-700 to-blue-950' :
      theme === 'lavender' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-800' :
      theme === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-teal-900' :
      'bg-gradient-to-b from-slate-900 to-slate-950'
    }`}>
      <div className="mx-auto flex max-w-sm flex-col items-center">
        <div className={`mb-6 h-32 w-32 overflow-hidden rounded-full border-4 shadow-xl ${
          theme === 'light' ? 'border-slate-300 bg-slate-200' : theme === 'minimal' ? 'border-slate-200 bg-slate-100' :
          ['sunset', 'cherry', 'ocean', 'lavender', 'emerald'].includes(theme) ? 'border-white/30 bg-white/20' : 'border-slate-600 bg-slate-700'
        }`}>
          {thumbnail ? (
            <div className="relative h-full w-full">
              <Image
                src={thumbnail}
                alt={profile.name}
                fill
                sizes="128px"
                className={`object-cover ${isUnavailable ? 'blur-md grayscale' : ''}`}
              />
            </div>
          ) : (
            <div className={`flex h-full w-full items-center justify-center text-3xl font-bold ${theme === 'dark' ? 'text-slate-500' : richTheme ? 'text-white/70' : 'text-slate-400'}`}>
              {profile.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <h1 className={`text-center text-2xl font-bold ${
          theme === 'dark' || richTheme ? 'text-white' : 'text-slate-900'
        }`}>{profile.name}</h1>
        {(profile.city || profile.state) && (
          <p className={`mt-1 text-sm ${
            theme === 'dark' ? 'text-slate-400' : richTheme ? 'text-white/80' : 'text-slate-600'
          }`}>
            {[profile.city, profile.state].filter(Boolean).join(', ')}
          </p>
        )}
        {(profile.short_description?.trim() || description) && (
          <p className={`mt-3 max-w-sm text-center text-sm ${
            theme === 'dark' ? 'text-slate-300' : richTheme ? 'text-white/90' : 'text-slate-600'
          }`}>{profile.short_description?.trim() || description}</p>
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {profile.verified && (
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
              Verificado
            </span>
          )}
          {profile.is_online && (
            <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
              Online
            </span>
          )}
        </div>
        {isUnavailable && (
          <p className="mt-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-200">
            Perfil indisponível no momento. A foto fica desfocada até a renovação do anúncio.
          </p>
        )}

        {visibleBioLinks.length > 0 && (
          <div className="mt-6 w-full max-w-sm space-y-2">
            {visibleBioLinks.map((link, i) => (
              <a
                key={i}
                href={withContactPrefillIfNeeded(link.url, profileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full rounded-xl border py-3 text-center text-sm font-medium transition hover:opacity-90 ${linkButtonClass}`}
                style={linkButtonStyle}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
        <div className="mt-8 w-full max-w-sm space-y-3">
          {contactExpired ? (
            <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200">
              Contato indisponível. Anúncio expirado.
            </p>
          ) : (
            <>
              {canStartMessage && canMessage && (
                canOpenMessageThread ? (
                  <Link
                    href={`/mensagens?with=${encodeURIComponent(profile.user_id)}`}
                    onClick={() => trackClick('message')}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3.5 font-medium transition hover:opacity-90 ${linkButtonClass}`}
                    style={linkButtonStyle}
                  >
                    <MessageCircle className="h-5 w-5" />
                    Enviar mensagem
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3.5 font-medium opacity-80 ${linkButtonClass}`}
                    style={linkButtonStyle}
                    title={messagesSettings.loaded ? messagesNotice : 'Verificando mensagens...'}
                  >
                    <MessageCircle className="h-5 w-5" />
                    {messagesSettings.loaded ? 'Mensagens indisponíveis' : 'Verificando mensagens...'}
                  </button>
                )
              )}
              {whatsappHref && !hasBioLink(whatsappHref) && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick('whatsapp')}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3.5 font-medium transition hover:opacity-90 ${linkButtonClass}`}
                  style={linkButtonStyle}
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </a>
              )}
              {telegramHref && !hasBioLink(telegramHref) && (
                <a
                  href={telegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick('telegram')}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3.5 font-medium transition hover:opacity-90 ${linkButtonClass}`}
                  style={linkButtonStyle}
                >
                  Telegram
                </a>
              )}
              {phoneHref && !hasBioLink(phoneHref) && (
                <a
                  href={phoneHref}
                  onClick={() => trackClick('phone')}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3.5 font-medium transition hover:opacity-90 ${linkButtonClass}`}
                  style={linkButtonStyle}
                >
                  Ligar
                </a>
              )}
            </>
          )}
        </div>
        {shouldLoadMessagesSettings && messagesSettings.loaded && !messagesSettings.enabled && (
          <p className={`mt-3 max-w-sm rounded-lg border px-4 py-3 text-center text-sm ${
            theme === 'dark'
              ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
              : theme === 'sunset' || theme === 'cherry'
                ? 'border-white/30 bg-black/15 text-white'
                : 'border-amber-500/40 bg-amber-100 text-amber-900'
          }`}>
            {messagesNotice}
          </p>
        )}

        {visibleSocialLinks.length > 0 && (
            <div className="mt-6 w-full max-w-sm">
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Redes sociais
              </p>
              <div className="grid grid-cols-2 gap-2">
                {instagramHref && !hasBioLink(instagramHref) && (
                  <a
                    href={instagramHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('instagram')}
                    className={`flex items-center justify-center rounded-xl border py-3 text-sm font-medium transition hover:opacity-90 ${linkButtonClass}`}
                    style={linkButtonStyle}
                  >
                    Instagram
                  </a>
                )}
                {twitterHref && !hasBioLink(twitterHref) && (
                  <a
                    href={twitterHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('twitter')}
                    className={`flex items-center justify-center rounded-xl border py-3 text-sm font-medium transition hover:opacity-90 ${linkButtonClass}`}
                    style={linkButtonStyle}
                  >
                    X
                  </a>
                )}
                {privacyHref && !hasBioLink(privacyHref) && (
                  <a
                    href={privacyHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('privacy')}
                    className={`flex items-center justify-center rounded-xl border py-3 text-sm font-medium transition hover:opacity-90 ${linkButtonClass}`}
                    style={linkButtonStyle}
                  >
                    Privacy
                  </a>
                )}
                {onlyfansHref && !hasBioLink(onlyfansHref) && (
                  <a
                    href={onlyfansHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('onlyfans')}
                    className={`flex items-center justify-center rounded-xl border py-3 text-sm font-medium transition hover:opacity-90 ${linkButtonClass}`}
                    style={linkButtonStyle}
                  >
                    OnlyFans
                  </a>
                )}
              </div>
            </div>
          )}

        {profile.bio_show_full_profile !== false && (
          <Link
            href={pathname ? `${pathname}?view=full` : '#'}
            className={`mt-6 text-center text-sm underline transition ${
              theme === 'dark' ? 'text-slate-400 hover:text-slate-300' : theme === 'sunset' || theme === 'cherry' ? 'text-white/80 hover:text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Ver perfil completo
          </Link>
        )}

        <div className={`mt-8 flex flex-col items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : theme === 'sunset' || theme === 'cherry' ? 'text-white/70' : 'text-slate-500'}`}>
          <p className="text-center text-sm">Faça parte do</p>
          <Link href="/" className="mt-1 block h-8 w-auto max-w-[140px]" title="Página inicial">
            <Image
              src="/logo-header.png"
              alt="CerejaVIP"
              width={140}
              height={32}
              sizes="140px"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <p className="mt-3 text-center text-[10px] opacity-80">cerejavip.com © 2026</p>
        </div>
      </div>
    </div>
  )
}
