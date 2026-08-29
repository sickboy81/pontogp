/**
 * Converts the optional public username into a URL-safe, stable slug.
 * Empty/invalid values intentionally become null so callers keep the ID URL.
 */
export function normalizePublicProfileSlug(value) {
  const normalized = String(value ?? '')
    .trim()
    .replace(/^@+/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')

  return normalized || null
}
