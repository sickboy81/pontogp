/** Texto enviado junto ao abrir WhatsApp ou Telegram a partir de um anúncio. */
const PREFILL_INTRO = 'Olá! Vi seu anúncio no site CerejaVIP.'

export function buildContactPrefillMessage(profileUrl: string): string {
  const url = profileUrl.trim()
  if (!url) return PREFILL_INTRO
  return `${PREFILL_INTRO}\n\n${url}`
}

/** Link wa.me com mensagem pré-preenchida (phone só dígitos, com código do país). */
export function whatsAppContactHref(phoneDigits: string, profileUrl: string): string {
  const digits = phoneDigits.replace(/\D/g, '')
  if (!digits) return 'https://wa.me/'
  const text = buildContactPrefillMessage(profileUrl)
  return `https://wa.me/${digits}?${new URLSearchParams({ text }).toString()}`
}

/** Primeiro segmento do username Telegram (sem @, path ou query acidental). */
function telegramUsernameForPath(raw: string): string {
  return raw.replace(/^@/, '').trim().split(/[/?#]/)[0] || ''
}

/** Link t.me com texto sugerido. */
export function telegramContactHref(username: string, profileUrl: string): string {
  const u = telegramUsernameForPath(username)
  if (!u) return 'https://t.me/'
  const text = buildContactPrefillMessage(profileUrl)
  return `https://t.me/${u}?${new URLSearchParams({ text }).toString()}`
}
