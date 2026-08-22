export const BILLING_PERIODS = ['weekly', 'monthly']

export function normalizeBillingPeriod(value) {
  return value === 'monthly' ? 'monthly' : value === 'weekly' ? 'weekly' : null
}

export function getPlanPrice(plan, period) {
  const value = period === 'weekly' ? plan?.price_weekly : plan?.price_monthly
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

export function getPlanDurationDays(period) {
  return period === 'weekly' ? 7 : 30
}

export function isPlanPurchaseValid(plan, period, amount) {
  const expected = getPlanPrice(plan, period)
  return !!plan?.enabled && plan?.target_type === 'advertiser' && expected >= 10 && Math.abs(Number(amount) - expected) < 0.005
}
