/**
 * @param {unknown} isOnline
 * @param {unknown} onlineUntil
 * @param {Date} [now]
 */
export function isProfileEffectivelyOnline(isOnline, onlineUntil, now = new Date()) {
  if (isOnline !== true) return false
  if (!onlineUntil) return true

  const deadline = new Date(String(onlineUntil))
  if (Number.isNaN(deadline.getTime())) return false

  return deadline > now
}
