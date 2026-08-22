export function normalizeCouponType(value) {
  return value === 'percentage' ? 'percentage' : 'plan'
}

export function applyCouponDiscount(amount, discountPercent) {
  const base = Number(amount)
  const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0))
  if (!Number.isFinite(base) || base < 10) return 0
  return Math.max(10, Math.round((base * (1 - discount / 100)) * 100) / 100)
}

export function buildCouponShareUrl(appUrl, code) {
  const normalizedUrl = String(appUrl || 'https://cerejavip.com').replace(/\/$/, '')
  return `${normalizedUrl}/planos?cupom=${encodeURIComponent(String(code || '').trim().toUpperCase())}`
}
