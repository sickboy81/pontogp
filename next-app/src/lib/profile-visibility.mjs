const DAY_MS = 24 * 60 * 60 * 1000

/**
 * @typedef {object} ProfileVisibilityPolicy
 * @property {number} blur_after_days
 * @property {number} remove_from_search_after_days
 * @property {number} archive_after_days
 */

/**
 * @typedef {object} ProfileVisibilityState
 * @property {'normal' | 'unavailable' | 'archived'} mode
 * @property {boolean} listed
 * @property {boolean} direct
 * @property {boolean} archived
 */

/** @type {Readonly<ProfileVisibilityPolicy>} */
export const DEFAULT_PROFILE_VISIBILITY_POLICY = Object.freeze({
  blur_after_days: 7,
  remove_from_search_after_days: 30,
  archive_after_days: 90,
})

function asPolicyInteger(value, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(365, Math.max(1, Math.floor(value)))
}

/** @param {unknown} raw @returns {ProfileVisibilityPolicy} */
export function parseProfileVisibilityPolicy(raw) {
  let source = raw
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source)
    } catch {
      source = null
    }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return { ...DEFAULT_PROFILE_VISIBILITY_POLICY }
  }

  const legacyBlur = source.unavailable_after_days
  let blur = asPolicyInteger(
    source.blur_after_days,
    asPolicyInteger(legacyBlur, DEFAULT_PROFILE_VISIBILITY_POLICY.blur_after_days),
  )
  let remove = asPolicyInteger(
    source.remove_from_search_after_days,
    DEFAULT_PROFILE_VISIBILITY_POLICY.remove_from_search_after_days,
  )
  let archive = asPolicyInteger(
    source.archive_after_days,
    DEFAULT_PROFILE_VISIBILITY_POLICY.archive_after_days,
  )

  archive = Math.max(3, archive)
  if (blur >= archive - 1) blur = archive - 2
  if (remove <= blur) remove = blur + 1
  if (remove >= archive) remove = archive - 1
  if (blur >= remove) blur = remove - 1

  return {
    blur_after_days: blur,
    remove_from_search_after_days: remove,
    archive_after_days: archive,
  }
}

/**
 * @param {string | number | Date | null | undefined} expiration
 * @param {string | number | Date} [now]
 */
export function getExpiredDays(expiration, now = new Date()) {
  if (expiration == null || expiration === '') return null

  const expirationTime = new Date(expiration).getTime()
  const nowTime = new Date(now).getTime()
  if (!Number.isFinite(expirationTime) || !Number.isFinite(nowTime) || expirationTime > nowTime) {
    return null
  }

  return Math.floor((nowTime - expirationTime) / DAY_MS)
}

/**
 * @param {string | number | Date | null | undefined} expiration
 * @param {string | number | Date} [now]
 * @param {ProfileVisibilityPolicy} [policy]
 * @returns {ProfileVisibilityState}
 */
export function getProfileVisibilityState(
  expiration,
  now = new Date(),
  policy = DEFAULT_PROFILE_VISIBILITY_POLICY,
) {
  const expiredDays = getExpiredDays(expiration, now)
  if (expiredDays == null || expiredDays < policy.blur_after_days) {
    return { mode: 'normal', listed: true, direct: true, archived: false }
  }
  if (expiredDays < policy.remove_from_search_after_days) {
    return { mode: 'unavailable', listed: true, direct: true, archived: false }
  }
  if (expiredDays < policy.archive_after_days) {
    return { mode: 'unavailable', listed: false, direct: true, archived: false }
  }
  return { mode: 'archived', listed: false, direct: false, archived: true }
}

/**
 * @param {string | number | Date | null | undefined} expiration
 * @param {string | number | Date} [now]
 * @param {ProfileVisibilityPolicy} [policy]
 */
export function isProfileListed(
  expiration,
  now = new Date(),
  policy = DEFAULT_PROFILE_VISIBILITY_POLICY,
) {
  return getProfileVisibilityState(expiration, now, policy).listed
}

/**
 * @param {string | number | Date | null | undefined} expiration
 * @param {string | number | Date} [now]
 * @param {ProfileVisibilityPolicy} [policy]
 */
export function isProfileDirectlyVisible(
  expiration,
  now = new Date(),
  policy = DEFAULT_PROFILE_VISIBILITY_POLICY,
) {
  return getProfileVisibilityState(expiration, now, policy).direct
}

/**
 * @param {string | number | Date} [now]
 * @param {ProfileVisibilityPolicy} [policy]
 */
export function buildProfileListCutoff(
  now = new Date(),
  policy = DEFAULT_PROFILE_VISIBILITY_POLICY,
) {
  return new Date(new Date(now).getTime() - policy.remove_from_search_after_days * DAY_MS)
}

/**
 * @param {string | number | Date} [now]
 * @param {ProfileVisibilityPolicy} [policy]
 */
export function buildProfileArchiveCutoff(
  now = new Date(),
  policy = DEFAULT_PROFILE_VISIBILITY_POLICY,
) {
  return new Date(new Date(now).getTime() - policy.archive_after_days * DAY_MS)
}

/**
 * @template {Record<string, unknown>} T
 * @param {T & { search_expires_at?: string | number | Date | null }} profile
 * @param {string | number | Date} [now]
 * @param {ProfileVisibilityPolicy} [policy]
 */
export function applyProfileVisibilityState(
  profile,
  now = new Date(),
  policy = DEFAULT_PROFILE_VISIBILITY_POLICY,
) {
  const state = getProfileVisibilityState(profile.search_expires_at, now, policy)
  const searchExpiredDays = getExpiredDays(profile.search_expires_at, now) ?? 0

  return {
    profile: {
      ...profile,
      visibility_mode: state.mode,
      search_expired_days: searchExpiredDays,
      is_unavailable: state.mode === 'unavailable',
    },
    state,
  }
}
