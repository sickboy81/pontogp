import type { Profile } from '@/lib/types'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

/**
 * Retorna a URL absoluta da foto principal do perfil para Open Graph / Twitter Card.
 * Usa a primeira foto (foto principal) em tamanho completo para melhor qualidade no compartilhamento.
 * Garante que a URL seja sempre absoluta para crawlers (Facebook, WhatsApp, Telegram, etc.).
 */
export function getProfileOgImageUrl(profile: Profile | null): string {
  if (!profile) return `${SITE_URL}/logo-cerejavip.png`
  // Foto principal: primeira foto em tamanho completo; fallback para thumbnail (mesma foto, redimensionada)
  const mainPhoto = profile.photos?.[0] || profile.thumbnail || ''
  if (!mainPhoto) return `${SITE_URL}/logo-cerejavip.png`
  // Garantir URL absoluta (PocketBase já retorna absoluta; se vier relativa, prefixar)
  if (mainPhoto.startsWith('http://') || mainPhoto.startsWith('https://')) return mainPhoto
  return mainPhoto.startsWith('/') ? `${SITE_URL}${mainPhoto}` : `${SITE_URL}/${mainPhoto}`
}
