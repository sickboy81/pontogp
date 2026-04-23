/** Valor de `settings.key = "expiration_durations"` (objeto em JSON no PocketBase, por vezes devolvido como string). */
export type ExpirationDurationsMap = Record<
  string,
  { contact_days?: number; search_days?: number }
>

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
