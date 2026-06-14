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
