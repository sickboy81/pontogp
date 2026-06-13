export function isProfileBumpEligible(
  profile: {
    status?: unknown
    search_expires_at?: unknown
    contact_expires_at?: unknown
  },
  now?: Date
): boolean
