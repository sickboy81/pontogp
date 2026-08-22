import test from 'node:test'
import assert from 'node:assert/strict'
import { applyCouponDiscount, normalizeCouponType, buildCouponShareUrl } from './coupon-contract.mjs'

test('normalizes plan and percentage coupon types', () => {
  assert.equal(normalizeCouponType('plan'), 'plan')
  assert.equal(normalizeCouponType('percentage'), 'percentage')
  assert.equal(normalizeCouponType('unknown'), 'plan')
})

test('calculates percentage discounts without going below the PIX minimum', () => {
  assert.equal(applyCouponDiscount(100, 20), 80)
  assert.equal(applyCouponDiscount(100, 150), 10)
  assert.equal(applyCouponDiscount(9, 20), 0)
})

test('builds a shareable coupon link without exposing redemption state', () => {
  assert.equal(buildCouponShareUrl('https://cerejavip.com', 'ouro 30'), 'https://cerejavip.com/planos?cupom=OURO%2030')
})
