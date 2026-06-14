export type ProfileVisibilityPolicy = {
  blur_after_days: number
  remove_from_search_after_days: number
  archive_after_days: number
  /** @deprecated Use `blur_after_days`. Kept temporarily for existing callers. */
  readonly unavailable_after_days: number
}

export type ProfileVisibilityState = {
  state: 'normal' | 'unavailable' | 'archived'
  listed: boolean
  direct: boolean
  archived: boolean
}

export const DEFAULT_PROFILE_VISIBILITY_POLICY: Readonly<
  Omit<ProfileVisibilityPolicy, 'unavailable_after_days'>
>

export function parseProfileVisibilityPolicy(raw: unknown): ProfileVisibilityPolicy

export function getExpiredDays(
  expiration: string | number | Date | null | undefined,
  now?: string | number | Date,
): number | null

export function getProfileVisibilityState(
  expiration: string | number | Date | null | undefined,
  now?: string | number | Date,
  policy?: Omit<ProfileVisibilityPolicy, 'unavailable_after_days'>,
): ProfileVisibilityState
