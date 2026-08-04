const VALID_REGISTRATION_ROLES = new Set(['advertiser', 'user'])

/**
 * @param {unknown} value
 * @returns {'advertiser' | 'user' | null}
 */
export function parseRegistrationRole(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return VALID_REGISTRATION_ROLES.has(normalized)
    ? /** @type {'advertiser' | 'user'} */ (normalized)
    : null
}
