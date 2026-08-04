export type ProfileContactVisibilityState = {
  contactExpired: boolean
  canStartMessage: boolean
  showCustomBioLinks: boolean
}

export function getProfileContactVisibilityState(
  contactExpiresAt: string | number | Date | null | undefined,
  now?: string | number | Date,
): ProfileContactVisibilityState
