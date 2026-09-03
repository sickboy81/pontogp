/** Texto enviado junto ao abrir WhatsApp ou Telegram a partir de um anúncio. */
const PREFILL_INTRO = 'Olá! Vi seu anúncio no site CerejaVIP.'

function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '')
}

/**
 * Normaliza telefones brasileiros informados com DDD e acrescenta o DDI +55
 * no formato E.164 sem o sinal de mais. Números internacionais só são aceitos quando o código de país foi
 * informado explicitamente com + ou 00.
 */
export function normalizeContactPhoneDigits(raw) {
  const value = String(raw ?? '').trim()
  if (!value) return ''

  let digits = digitsOnly(value)
  if (!digits) return ''

  if (value.startsWith('+')) {
    return /^[1-9]\d{7,14}$/.test(digits) ? digits : ''
  }

  if (digits.startsWith('00')) {
    digits = digits.slice(2)
    return /^[1-9]\d{7,14}$/.test(digits) ? digits : ''
  }

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits
  }

  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    digits = digits.slice(1)
  }

  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return ''
}

export function phoneContactHref(raw) {
  const digits = normalizeContactPhoneDigits(raw)
  return digits ? `tel:+${digits}` : ''
}

export function whatsAppBaseHref(raw) {
  const digits = normalizeContactPhoneDigits(raw)
  return digits ? `https://wa.me/${digits}` : ''
}

export function telegramBaseHref(raw) {
  const value = String(raw ?? '').trim()
  if (!value) return ''

  let username = value
  try {
    const parsed = new URL(value)
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase()
    if (host !== 't.me' && host !== 'telegram.me') return ''
    username = parsed.pathname.split('/').filter(Boolean)[0] || ''
  } catch {
    username = value.replace(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\//i, '')
  }

  username = username.replace(/^@+/, '').split(/[/?#]/)[0] || ''
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username) ? `https://t.me/${username}` : ''
}

export function buildContactPrefillMessage(profileUrl) {
  const url = String(profileUrl ?? '').trim()
  if (!url) return PREFILL_INTRO
  return `${PREFILL_INTRO}\n\n${url}`
}

/** Link wa.me com número E.164 e mensagem pré-preenchida. */
export function whatsAppContactHref(raw, profileUrl) {
  const href = whatsAppBaseHref(raw)
  if (!href) return ''
  const text = buildContactPrefillMessage(profileUrl)
  return `${href}?${new URLSearchParams({ text }).toString()}`
}

/** Link t.me com username normalizado e texto sugerido. */
export function telegramContactHref(raw, profileUrl) {
  const href = telegramBaseHref(raw)
  if (!href) return ''
  const text = buildContactPrefillMessage(profileUrl)
  return `${href}?${new URLSearchParams({ text }).toString()}`
}
