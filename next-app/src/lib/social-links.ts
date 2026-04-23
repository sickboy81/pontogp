/** Gera URL clicável a partir do texto guardado no perfil (username ou URL completa). */
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
  return `https://${t}`
}
