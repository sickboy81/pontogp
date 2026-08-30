import test from 'node:test'
import assert from 'node:assert/strict'
import { getEmailTemplate, getResendCooldownState } from './email-center.mjs'

test('returns the profile completion template metadata', () => {
  const template = getEmailTemplate('profile-completion')
  assert.equal(template?.audience, 'Anunciantes com perfil em rascunho')
  assert.equal(template?.cooldownDays, 7)
})

test('blocks a reminder resend during the cooldown window', () => {
  const state = getResendCooldownState('2026-08-30T12:00:00.000Z', new Date('2026-09-02T12:00:00.000Z'))
  assert.equal(state.allowed, false)
  assert.equal(state.remainingHours, 96)
})

test('allows a reminder after the cooldown window', () => {
  const state = getResendCooldownState('2026-08-23T12:00:00.000Z', new Date('2026-08-30T12:00:00.000Z'))
  assert.equal(state.allowed, true)
})
