/** Gera URL clicável a partir do texto guardado no perfil (username ou URL completa). */

function isOnlyfansHost(host: string): boolean {
  return host.replace(/^www\./i, '').toLowerCase() === 'onlyfans.com'
}

function isPrivacyHost(host: string): boolean {
  return host.replace(/^www\./i, '').toLowerCase() === 'privacy.com.br'
}

/** Apenas o nome de utilizador (sem @), a partir de texto livre ou URL OnlyFans. */
export function parseOnlyfansUsername(raw: string | null | undefined): string {
  if (raw == null) return ''
  let s = String(raw).trim()
  if (!s) return ''
  s = s.replace(/^@+/, '')
  if (/^https?:\/\//i.test(s) || /onlyfans\.com/i.test(s)) {
    const withProto = /^https?:/i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`
    try {
      const u = new URL(withProto)
      if (isOnlyfansHost(u.hostname)) {
        const first = u.pathname.split('/').filter(Boolean)[0] ?? ''
        return first.split('?')[0] ?? ''
      }
    } catch {
      // ignore
    }
  }
  s = s.replace(/^(https?:\/\/)?(www\.)?onlyfans\.com\/?/i, '')
  const part = s.split('/')[0] ?? s
  return (part.split('?')[0] ?? '').trim()
}

/** Apenas o slug, a partir de texto ou URL do Privacy (privacy.com.br). */
export function parsePrivacyUsername(raw: string | null | undefined): string {
  if (raw == null) return ''
  let s = String(raw).trim()
  if (!s) return ''
  s = s.replace(/^@+/, '')
  if (/^https?:\/\//i.test(s) || /privacy\.com\.br/i.test(s)) {
    const withProto = /^https?:/i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`
    try {
      const u = new URL(withProto)
      if (isPrivacyHost(u.hostname)) {
        const parts = u.pathname.split('/').filter(Boolean)
        if (parts.length >= 1) {
          const last = parts[parts.length - 1]!
          return (last.split('?')[0] ?? '').trim()
        }
      }
    } catch {
      // ignore
    }
  }
  const last = s.split('/').filter(Boolean).pop() ?? s
  return (last.split('?')[0] ?? '').trim()
}

function privacyHrefFromUsername(slug: string): string {
  return `https://privacy.com.br/checkout/${encodeURIComponent(slug)}`
}

export function socialProfileHref(
  raw: string | undefined,
  kind: 'instagram' | 'twitter' | 'privacy' | 'onlyfans'
): string | null {
  const t = raw?.trim()
  if (!t) return null
  if (/^https?:\/\//i.test(t)) return t
  if (kind === 'instagram') {
    const u = t.replace(/^@/, '').replace(/^instagram\.com\/?/i, '')
    return `https://instagram.com/${u}`
  }
  if (kind === 'twitter') {
    const u = t.replace(/^@/, '').replace(/^(x|twitter)\.com\/?/i, '')
    return `https://x.com/${u}`
  }
  if (kind === 'onlyfans') {
    const u = parseOnlyfansUsername(t)
    if (!u) return null
    return `https://onlyfans.com/${u}`
  }
  if (kind === 'privacy') {
    const u = parsePrivacyUsername(t)
    if (!u) return null
    return privacyHrefFromUsername(u)
  }
  return `https://${t}`
}
