function hasExpired(value, now) {
  if (!value) return false
  const expiresAt = new Date(value)
  if (Number.isNaN(expiresAt.getTime())) return false
  return expiresAt.getTime() <= now.getTime()
}

export function isProfileBumpEligible(profile, now = new Date()) {
  return (
    profile?.status === 'active' &&
    !hasExpired(profile?.search_expires_at, now) &&
    !hasExpired(profile?.contact_expires_at, now)
  )
}
