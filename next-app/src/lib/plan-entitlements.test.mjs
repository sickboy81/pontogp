import test from 'node:test'
import assert from 'node:assert/strict'
import { canAddMedia, isPaymentFulfilled, renewalBaseDate } from './plan-entitlements.mjs'

test('renovação preserva o maior vencimento existente', () => {
  const now = new Date('2026-08-22T12:00:00.000Z')
  const current = new Date('2026-09-01T12:00:00.000Z')
  assert.equal(renewalBaseDate(current.toISOString(), now).toISOString(), current.toISOString())
  assert.equal(renewalBaseDate('', now).toISOString(), now.toISOString())
})

test('limites de mídia bloqueiam upload acima da capacidade do plano', () => {
  assert.equal(canAddMedia({ max_photos: 3 }, 'photos', 3), false)
  assert.equal(canAddMedia({ max_photos: 3 }, 'photos', 2), true)
  assert.equal(canAddMedia({ max_photos: -1 }, 'photos', 999), true)
  assert.equal(canAddMedia({ max_videos: 0 }, 'videos', 0), false)
  assert.equal(canAddMedia({ max_videos: 2 }, 'videos', 1), true)
  assert.equal(canAddMedia({ max_audio: 0 }, 'audio', 0), false)
})

test('pagamento pago sem fulfillment pode ser processado novamente', () => {
  assert.equal(isPaymentFulfilled({ status: 'paid', fulfilled_at: '2026-08-22 12:00:00' }), true)
  assert.equal(isPaymentFulfilled({ status: 'paid', fulfilled_at: '' }), false)
  assert.equal(isPaymentFulfilled({ status: 'pending' }), false)
})
