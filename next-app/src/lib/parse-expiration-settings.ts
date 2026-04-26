/** Valor de `settings.key = "expiration_durations"` (objeto em JSON no PocketBase, por vezes devolvido como string). */
export type ExpirationDurationsMap = Record<
  string,
  { contact_days?: number; search_days?: number }
>

export type ProfileVisibilityPolicy = {
  unavailable_after_days: number
  archive_after_days: number
}

export function parseExpirationDurationsValue(raw: unknown): ExpirationDurationsMap {
  if (raw == null) return {}
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown
      if (p && typeof p === 'object' && !Array.isArray(p)) return p as ExpirationDurationsMap
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as ExpirationDurationsMap
  return {}
}

export function parseProfileVisibilityPolicy(raw: unknown): ProfileVisibilityPolicy {
  const defaults: ProfileVisibilityPolicy = {
    unavailable_after_days: 30,
    archive_after_days: 90,
  }
  let source: unknown = raw
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source) as unknown
    } catch {
      return defaults
    }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) return defaults
  const candidate = source as Partial<ProfileVisibilityPolicy>
  const unavailable =
    typeof candidate.unavailable_after_days === 'number' && candidate.unavailable_after_days >= 1
      ? Math.floor(candidate.unavailable_after_days)
      : defaults.unavailable_after_days
  let archive =
    // Compat: versões antigas podiam gravar 1. Aceitamos e normalizamos abaixo.
    typeof candidate.archive_after_days === 'number' && candidate.archive_after_days >= 1
      ? Math.floor(candidate.archive_after_days)
      : defaults.archive_after_days
  if (archive <= unavailable) archive = unavailable + 1
  return { unavailable_after_days: unavailable, archive_after_days: archive }
}
