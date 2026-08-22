export function normalizeCouponType(value: unknown): 'plan' | 'percentage'
export function applyCouponDiscount(amount: number, discountPercent: number): number
export function buildCouponShareUrl(appUrl?: string, code?: string): string
