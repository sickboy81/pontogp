import { parseProfileVisibilityPolicy } from './profile-visibility.mjs'

/**
 * Adds the field expected by the current admin page without changing the normalized policy.
 *
 * @param {{ blur_after_days: number, remove_from_search_after_days: number, archive_after_days: number }} policy
 */
export function serializeLegacyVisibilityPolicy(policy) {
  return {
    ...policy,
    unavailable_after_days: policy.blur_after_days,
  }
}

/**
 * Merges partial or legacy admin input over the stored canonical policy.
 *
 * @param {unknown} input
 * @param {unknown} current
 */
export function mergeVisibilityPolicyInput(input, current) {
  const base = parseProfileVisibilityPolicy(current)
  if (!input || typeof input !== 'object' || Array.isArray(input)) return base

  const candidate = input
  const blur =
    Object.hasOwn(candidate, 'blur_after_days')
      ? candidate.blur_after_days
      : Object.hasOwn(candidate, 'unavailable_after_days')
        ? candidate.unavailable_after_days
        : base.blur_after_days

  return parseProfileVisibilityPolicy({
    blur_after_days: blur,
    remove_from_search_after_days: Object.hasOwn(candidate, 'remove_from_search_after_days')
      ? candidate.remove_from_search_after_days
      : base.remove_from_search_after_days,
    archive_after_days: Object.hasOwn(candidate, 'archive_after_days')
      ? candidate.archive_after_days
      : base.archive_after_days,
  })
}
