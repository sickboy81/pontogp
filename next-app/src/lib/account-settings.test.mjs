import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeNotificationPreferences, selectCurrentPlan } from './account-settings.mjs'

test('normalizes account notification preferences with secure defaults', () => {
  assert.deepEqual(normalizeNotificationPreferences({ notify_messages: false, notify_payments: true }), {
    notify_messages: false,
    notify_payments: true,
    notify_plan_expiry: true,
    notify_security: true,
  })
})

test('selects the active paid plan before an expired record', () => {
  const plan = selectCurrentPlan([
    { plan: 'bronze', status: 'expired', created: '2026-08-20 10:00:00' },
    { plan: 'ouro', status: 'approved', expires_at: '2026-09-20 10:00:00', created: '2026-08-21 10:00:00' },
  ])
  assert.equal(plan?.plan, 'ouro')
})
