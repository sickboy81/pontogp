'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import type { Profile } from '@/lib/types'
import { socialProfileHref } from '@/lib/social-links'
import { telegramContactHref, whatsAppContactHref } from '@/lib/contact-prefill'

interface LinkBioViewProps {
  profile: Profile
  profileUrl: string
}

/**
 * Visual compacto "link na bio": foto, nome, descrição e botões de contato.
 * Usado quando display_mode === 'link_bio' na rota por slug.
 */
export default function LinkBioView({ profile, profileUrl }: LinkBioViewProps) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const canMessage = user && user.id !== profile.user_id

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

  const contactExpired =
    !!profile.contact_expires_at && new Date(profile.contact_expires_at) <= new Date()
  const photos = profile.photos?.length ? profile.photos : (profile.thumbnail ? [profile.thumbnail] : [])
  const avatarIndex =
    profile.bio_avatar_index != null && profile.bio_avatar_index >= 0 && profile.bio_avatar_index < photos.length
      ? profile.bio_avatar_index
      : 0
  const thumbnail = photos[avatarIndex] || profile.thumbnail || profile.photos?.[0]
  const description = profile.short_description?.trim() || profile.bio_title?.trim() || (profile.bio ? profile.bio.slice(0, 120) + (profile.bio.length > 120 ? '...' : '') : '')
  const theme = profile.bio_theme === 'light' ? 'light' : profile.bio_theme === 'minimal' ? 'minimal' : profile.bio_theme === 'sunset' ? 'sunset' : profile.bio_theme === 'cherry' ? 'cherry' : 'dark'
  const bioLinks = Array.isArray(profile.bio_links) ? profile.bio_links.filter((l) => l?.label && l?.url) : []
  const buttonColor = profile.bio_button_color?.trim()
  const linkButtonStyle = buttonColor ? { backgroundColor: buttonColor, borderColor: buttonColor, color: '#fff' } : undefined

  return (
    <div className={`min-h-screen px-4 py-12 ${
      theme === 'light' ? 'bg-gradient-to-b from-slate-100 to-slate-200' :
      theme === 'minimal' ? 'bg-white' :
      theme === 'sunset' ? 'bg-gradient-to-br from-orange-400/90 via-rose-500/90 to-rose-700' :
      theme === 'cherry' ? 'bg-gradient-to-br from-rose-800 to-red-950' :
      'bg-gradient-to-b from-slate-900 to-slate-950'
    }`}>
      <div className="mx-auto flex max-w-sm flex-col items-center">
        <div className={`mb-6 h-32 w-32 overflow-hidden rounded-full border-4 shadow-xl ${
          theme === 'light' ? 'border-slate-300 bg-slate-200' : theme === 'minimal' ? 'border-slate-200 bg-slate-100' :
          theme === 'sunset' || theme === 'cherry' ? 'border-white/30 bg-white/20' : 'border-slate-600 bg-slate-700'
        }`}>
          {thumbnail ? (
            <img src={thumbnail} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center text-3xl font-bold ${theme === 'dark' ? 'text-slate-500' : theme === 'sunset' || theme === 'cherry' ? 'text-white/70' : 'text-slate-400'}`}>
              {profile.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <h1 className={`text-center text-2xl font-bold ${
          theme === 'dark' || theme === 'sunset' || theme === 'cherry' ? 'text-white' : 'text-slate-900'
        }`}>{profile.name}</h1>
        {(profile.city || profile.state) && (
          <p className={`mt-1 text-sm ${
            theme === 'dark' ? 'text-slate-400' : theme === 'sunset' || theme === 'cherry' ? 'text-white/80' : 'text-slate-600'
          }`}>
            {[profile.city, profile.state].filter(Boolean).join(', ')}
          </p>
        )}
        {(profile.short_description?.trim() || description) && (
          <p className={`mt-3 max-w-sm text-center text-sm ${
            theme === 'dark' ? 'text-slate-300' : theme === 'sunset' || theme === 'cherry' ? 'text-white/90' : 'text-slate-600'
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

        {bioLinks.length > 0 && (
          <div className="mt-6 w-full max-w-sm space-y-2">
            {bioLinks.map((link, i) => (
              <a
                key={i}
                href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full rounded-xl border py-3 text-center text-sm font-medium transition hover:opacity-90 ${
                  linkButtonStyle ? 'text-white' : theme === 'dark'
                    ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : theme === 'sunset' || theme === 'cherry'
                    ? 'border-white/40 bg-white/20 text-white hover:bg-white/30'
                    : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
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
              {canMessage && (
                <Link
                  href={`/mensagens?with=${encodeURIComponent(profile.user_id)}`}
                  onClick={() => trackClick('message')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 font-medium text-white transition hover:bg-primary-500"
                >
                  <MessageCircle className="h-5 w-5" />
                  Enviar mensagem
                </Link>
              )}
              {profile.whatsapp && (
                <a
                  href={whatsAppContactHref(profile.whatsapp, profileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick('whatsapp')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-medium text-white transition hover:bg-green-500"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </a>
              )}
              {profile.telegram && (
                <a
                  href={telegramContactHref(profile.telegram, profileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick('telegram')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3.5 font-medium text-white transition hover:bg-sky-500"
                >
                  Telegram
                </a>
              )}
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  onClick={() => trackClick('phone')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 py-3.5 font-medium text-slate-200 transition hover:bg-slate-700"
                >
                  Ligar
                </a>
              )}
            </>
          )}
        </div>

        {!contactExpired &&
          (socialProfileHref(profile.instagram, 'instagram') ||
            socialProfileHref(profile.twitter, 'twitter') ||
            socialProfileHref(profile.privacy, 'privacy') ||
            socialProfileHref(profile.onlyfans, 'onlyfans')) && (
            <div className="mt-6 w-full max-w-sm">
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Redes sociais
              </p>
              <div className="grid grid-cols-2 gap-2">
                {socialProfileHref(profile.instagram, 'instagram') && (
                  <a
                    href={socialProfileHref(profile.instagram, 'instagram')!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('instagram')}
                    className="flex items-center justify-center rounded-xl bg-pink-600 py-3 text-sm font-medium text-white transition hover:bg-pink-500"
                  >
                    Instagram
                  </a>
                )}
                {socialProfileHref(profile.twitter, 'twitter') && (
                  <a
                    href={socialProfileHref(profile.twitter, 'twitter')!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('twitter')}
                    className="flex items-center justify-center rounded-xl bg-slate-600 py-3 text-sm font-medium text-white transition hover:bg-slate-500"
                  >
                    X
                  </a>
                )}
                {socialProfileHref(profile.privacy, 'privacy') && (
                  <a
                    href={socialProfileHref(profile.privacy, 'privacy')!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('privacy')}
                    className="flex items-center justify-center rounded-xl bg-orange-500 py-3 text-sm font-medium text-white transition hover:bg-orange-400"
                  >
                    Privacy
                  </a>
                )}
                {socialProfileHref(profile.onlyfans, 'onlyfans') && (
                  <a
                    href={socialProfileHref(profile.onlyfans, 'onlyfans')!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('onlyfans')}
                    className="flex items-center justify-center rounded-xl bg-cyan-500 py-3 text-sm font-medium text-white transition hover:bg-cyan-400"
                  >
                    OnlyFans
                  </a>
                )}
              </div>
            </div>
          )}

        <Link
          href={pathname ? `${pathname}?view=full` : '#'}
          className={`mt-6 text-center text-sm underline transition ${
            theme === 'dark' ? 'text-slate-400 hover:text-slate-300' : theme === 'sunset' || theme === 'cherry' ? 'text-white/80 hover:text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Ver perfil completo
        </Link>

        <div className={`mt-8 flex flex-col items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : theme === 'sunset' || theme === 'cherry' ? 'text-white/70' : 'text-slate-500'}`}>
          <p className="text-center text-sm">Faça parte do</p>
          <Link href="/" className="mt-1 block h-8 w-auto max-w-[140px]" title="Página inicial">
            <img src="/logo-header.png" alt="CerejaVIP" className="h-8 w-auto object-contain" />
          </Link>
          <p className="mt-3 text-center text-[10px] opacity-80">cerejavip.com © 2026</p>
        </div>
      </div>
    </div>
  )
}
