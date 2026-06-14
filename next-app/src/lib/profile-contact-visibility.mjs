/**
 * @param {string | number | Date | null | undefined} contactExpiresAt
 * @param {string | number | Date} [now]
 */
export function getProfileContactVisibilityState(contactExpiresAt, now = new Date()) {
  const expirationTime =
    contactExpiresAt == null || contactExpiresAt === ''
      ? Number.NaN
      : new Date(contactExpiresAt).getTime()
  const nowTime = new Date(now).getTime()
  const contactExpired =
    Number.isFinite(expirationTime) &&
    Number.isFinite(nowTime) &&
    expirationTime <= nowTime

  return {
    contactExpired,
    canStartMessage: !contactExpired,
    showCustomBioLinks: !contactExpired,
  }
}
