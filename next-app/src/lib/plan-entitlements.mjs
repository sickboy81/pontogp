export function renewalBaseDate(value, now = new Date()) {
  const current = value ? new Date(value) : null
  return current && !Number.isNaN(current.getTime()) && current > now ? current : now
}

export function canAddMedia(plan, type, currentCount) {
  const field = type === 'photos' ? 'max_photos' : type === 'videos' ? 'max_videos' : 'max_audio'
  const limit = Number(plan?.[field])
  if (limit === -1) return true
  if (!Number.isFinite(limit) || limit <= 0) return false
  return currentCount < limit
}

export function isPaymentFulfilled(payment) {
  return payment?.status === 'paid' && typeof payment?.fulfilled_at === 'string' && payment.fulfilled_at.length > 0
}
