import test from 'node:test'
import assert from 'node:assert/strict'
import { getPlanDurationDays, getPlanPrice, isPlanPurchaseValid, normalizeBillingPeriod } from './payment-plan-contract.mjs'

const plan = { enabled: true, target_type: 'advertiser', price_weekly: 20, price_monthly: 65 }

test('uses the selected billing period price and duration', () => {
  assert.equal(normalizeBillingPeriod('weekly'), 'weekly')
  assert.equal(getPlanPrice(plan, 'weekly'), 20)
  assert.equal(getPlanPrice(plan, 'monthly'), 65)
  assert.equal(getPlanDurationDays('weekly'), 7)
  assert.equal(getPlanDurationDays('monthly'), 30)
})

test('rejects tampered amounts, disabled plans and non-advertiser plans', () => {
  assert.equal(isPlanPurchaseValid(plan, 'weekly', 20), true)
  assert.equal(isPlanPurchaseValid(plan, 'weekly', 10), false)
  assert.equal(isPlanPurchaseValid({ ...plan, enabled: false }, 'weekly', 20), false)
  assert.equal(isPlanPurchaseValid({ ...plan, target_type: 'user' }, 'weekly', 20), false)
})
