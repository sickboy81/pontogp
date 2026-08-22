import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPlanExpiryEmail, buildPlanLifecycleEmail, getPlanLifecycleEvents, getReminderDays } from './plan-reminder.mjs'

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

test('gera eventos de email para vencimento, retirada da busca e arquivamento', () => {
  const now = new Date('2026-08-22T12:00:00.000Z')
  const expired = getPlanLifecycleEvents({
    search_expires_at: '2026-08-22T12:00:00.000Z',
    contact_expires_at: '2026-08-22T12:00:00.000Z',
  }, now)

  assert.deepEqual(expired.map((event) => event.type), [
    'plan_expired',
    'contact_expired',
  ])
  assert.deepEqual(getPlanLifecycleEvents({
    search_expires_at: '2026-07-23T12:00:00.000Z',
  }, now).map((event) => event.type), ['plan_expired', 'search_removed'])
  assert.deepEqual(getPlanLifecycleEvents({
    search_expires_at: '2026-05-24T12:00:00.000Z',
  }, now).map((event) => event.type), ['plan_expired', 'search_removed', 'profile_archived'])
})

test('emits contact and plan reminders when contact expires seven days before the plan', () => {
  const events = getPlanLifecycleEvents({
    search_expires_at: '2026-08-29T12:00:00.000Z',
    contact_expires_at: '2026-08-22T12:00:00.000Z',
  }, new Date('2026-08-22T12:00:00.000Z'))

  assert.deepEqual(events.map((event) => event.type), ['plan_expiring', 'contact_expired'])
})

test('describes the search removal and archive transitions in email content', () => {
  const removed = buildPlanLifecycleEmail({
    name: 'Cereja',
    expiresAt: '2026-07-23T12:00:00.000Z',
    eventType: 'search_removed',
    from: 'CerejaVIP <no-reply@cerejavip.com>',
    to: 'cereja@example.com',
  })
  const archived = buildPlanLifecycleEmail({
    name: 'Cereja',
    expiresAt: '2026-05-24T12:00:00.000Z',
    eventType: 'profile_archived',
    from: 'CerejaVIP <no-reply@cerejavip.com>',
    to: 'cereja@example.com',
  })

  assert.match(removed.text, /saiu da busca/i)
  assert.match(archived.text, /arquivado/i)
})
test('recovers lifecycle emails when the daily cron was offline on the exact day', () => {
  const events = getPlanLifecycleEvents({
    search_expires_at: '2026-07-01T12:00:00.000Z',
    contact_expires_at: '2026-07-01T12:00:00.000Z',
  }, new Date('2026-08-02T12:00:00.000Z'))

  assert.deepEqual(events.map((event) => event.type), [
    'plan_expired',
    'contact_expired',
    'search_removed',
  ])
})
