import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPlanExpiryEmail, getReminderDays } from './plan-reminder.mjs'

test('gera lembrete somente para sete dias antes ou no vencimento', () => {
  assert.deepEqual(getReminderDays(7), [7])
  assert.deepEqual(getReminderDays(0), [0])
  assert.deepEqual(getReminderDays(3), [])
})

test('gera email de renovação com link seguro e texto em português', () => {
  const email = buildPlanExpiryEmail({
    name: 'Cereja',
    expiresAt: '2026-08-29T12:00:00.000Z',
    appUrl: 'https://cerejavip.com',
    from: 'CerejaVIP <no-reply@cerejavip.com>',
    to: 'cereja@example.com',
  })
  assert.equal(email.to[0], 'cereja@example.com')
  assert.match(email.subject, /renovar/i)
  assert.match(email.html, /https:\/\/cerejavip\.com\/planos/)
  assert.match(email.text, /PIX/)
})
