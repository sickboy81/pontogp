export type ProfileVisibilityPolicy = {
  blur_after_days: number
  remove_from_search_after_days: number
  archive_after_days: number
}

export type ProfileVisibilityState = {
  mode: 'normal' | 'unavailable' | 'archived'
  listed: boolean
  direct: boolean
  archived: boolean
}

export const DEFAULT_PROFILE_VISIBILITY_POLICY: Readonly<ProfileVisibilityPolicy>

export function parseProfileVisibilityPolicy(raw: unknown): ProfileVisibilityPolicy

export function getExpiredDays(
  expiration: string | number | Date | null | undefined,
  now?: string | number | Date,
): number | null

export function getProfileVisibilityState(
  expiration: string | number | Date | null | undefined,
  now?: string | number | Date,
  policy?: ProfileVisibilityPolicy,
): ProfileVisibilityState

export function applyProfileVisibilityState<
  T extends { search_expires_at?: string | number | Date | null },
>(
  profile: T,
  now?: string | number | Date,
  policy?: ProfileVisibilityPolicy,
): {
  profile: T & {
    visibility_mode: ProfileVisibilityState['mode']
    search_expired_days: number
    is_unavailable: boolean
  }
  state: ProfileVisibilityState
}
