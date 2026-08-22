export function renewalBaseDate(value, now = new Date()) {
  const current = value ? new Date(value) : null
  return current && !Number.isNaN(current.getTime()) && current > now ? current : now
}

export function renewalExpiryDate(value, durationDays, now = new Date()) {
  const expiry = new Date(renewalBaseDate(value, now))
  expiry.setDate(expiry.getDate() + Math.max(1, Number(durationDays) || 0))
  return expiry
}

export function canAddMedia(plan, type, currentCount) {
  const field = type === 'photos' ? 'max_photos' : type === 'videos' ? 'max_videos' : 'max_audio'
  const limit = Number(plan?.[field])
  if (limit === -1) return true
  if (!Number.isFinite(limit) || limit <= 0) return false
  return currentCount < limit
}

export function analyticsLevelForPlan(plan) {
  const level = plan?.analytics_level
  if (level === 'views' || level === 'basic' || level === 'full') return level
  return plan?.slug === 'ouro' ? 'full' : plan?.slug === 'gratis' ? 'views' : 'basic'
}

export function shouldEnableVisualHighlight(plan) {
  return plan?.slug === 'ouro' && plan?.featured === true
}

export function profileVisualEntitlementPatch(plan) {
  const enabled = shouldEnableVisualHighlight(plan)
  return { featured: enabled, visual_highlight: enabled }
}

export function isPaymentFulfilled(payment) {
  return payment?.status === 'paid' && typeof payment?.fulfilled_at === 'string' && payment.fulfilled_at.length > 0
}
