const DAY_MS = 24 * 60 * 60 * 1000

export const DEFAULT_PROFILE_VISIBILITY_POLICY = Object.freeze({
  blur_after_days: 7,
  remove_from_search_after_days: 30,
  archive_after_days: 90,
})

function asPolicyInteger(value, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(365, Math.max(1, Math.floor(value)))
}

function withLegacyUnavailableAlias(policy) {
  return Object.defineProperty(policy, 'unavailable_after_days', {
    configurable: false,
    enumerable: false,
    get() {
      return policy.blur_after_days
    },
  })
}

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
    return withLegacyUnavailableAlias({ ...DEFAULT_PROFILE_VISIBILITY_POLICY })
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

  return withLegacyUnavailableAlias({
    blur_after_days: blur,
    remove_from_search_after_days: remove,
    archive_after_days: archive,
  })
}

export function getExpiredDays(expiration, now = new Date()) {
  if (expiration == null || expiration === '') return null

  const expirationTime = new Date(expiration).getTime()
  const nowTime = new Date(now).getTime()
  if (!Number.isFinite(expirationTime) || !Number.isFinite(nowTime) || expirationTime > nowTime) {
    return null
  }

  return Math.floor((nowTime - expirationTime) / DAY_MS)
}

export function getProfileVisibilityState(
  expiration,
  now = new Date(),
  policy = DEFAULT_PROFILE_VISIBILITY_POLICY,
) {
  const expiredDays = getExpiredDays(expiration, now)
  if (expiredDays == null || expiredDays < policy.blur_after_days) {
    return { state: 'normal', listed: true, direct: true, archived: false }
  }
  if (expiredDays < policy.remove_from_search_after_days) {
    return { state: 'unavailable', listed: true, direct: true, archived: false }
  }
  if (expiredDays < policy.archive_after_days) {
    return { state: 'unavailable', listed: false, direct: true, archived: false }
  }
  return { state: 'archived', listed: false, direct: false, archived: true }
}
