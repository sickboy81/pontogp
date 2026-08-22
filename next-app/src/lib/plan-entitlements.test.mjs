import test from 'node:test'
import assert from 'node:assert/strict'
import {
  analyticsLevelForPlan,
  canAddMedia,
  isPaymentFulfilled,
  renewalBaseDate,
  profileVisualEntitlementPatch,
  shouldEnableVisualHighlight,
} from './plan-entitlements.mjs'

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

test('cada plano recebe apenas o nível de analytics contratado', () => {
  assert.equal(analyticsLevelForPlan({ slug: 'gratis', analytics_level: 'views' }), 'views')
  assert.equal(analyticsLevelForPlan({ slug: 'bronze', analytics_level: 'basic' }), 'basic')
  assert.equal(analyticsLevelForPlan({ slug: 'prata', analytics_level: 'basic' }), 'basic')
  assert.equal(analyticsLevelForPlan({ slug: 'ouro', analytics_level: 'full' }), 'full')
})

test('destaque visual é concedido somente ao plano Ouro', () => {
  assert.equal(shouldEnableVisualHighlight({ slug: 'bronze', featured: true }), false)
  assert.equal(shouldEnableVisualHighlight({ slug: 'prata', featured: true }), false)
  assert.equal(shouldEnableVisualHighlight({ slug: 'ouro', featured: true }), true)
  assert.equal(shouldEnableVisualHighlight({ slug: 'ouro', featured: false }), false)
})

test('downgrade remove o destaque visual do perfil', () => {
  assert.deepEqual(profileVisualEntitlementPatch({ slug: 'gratis' }), { featured: false, visual_highlight: false })
  assert.deepEqual(profileVisualEntitlementPatch({ slug: 'prata', featured: true }), { featured: false, visual_highlight: false })
  assert.deepEqual(profileVisualEntitlementPatch({ slug: 'ouro', featured: true }), { featured: true, visual_highlight: true })
})
