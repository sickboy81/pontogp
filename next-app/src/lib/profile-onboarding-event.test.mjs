import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeProfileOnboardingEvent } from './profile-onboarding-event.mjs'

test('accepts a known onboarding event and step', () => {
  assert.deepEqual(
    normalizeProfileOnboardingEvent({ event: 'step_viewed', step: 'details' }),
    { event: 'step_viewed', step: 'details' }
  )
})

test('drops profile content and account data from a valid event', () => {
  assert.deepEqual(
    normalizeProfileOnboardingEvent({
      event: 'draft_saved',
      step: 'details',
      bio: 'conteúdo privado',
      email: 'pessoa@example.com',
      profileId: 'private-id',
    }),
    { event: 'draft_saved', step: 'details' }
  )
})

test('rejects unknown onboarding events and steps', () => {
  assert.equal(normalizeProfileOnboardingEvent({ event: 'typing', step: 'bio' }), null)
  assert.equal(normalizeProfileOnboardingEvent({ event: 'step_viewed', step: 'unknown' }), null)
  assert.equal(normalizeProfileOnboardingEvent(null), null)
})
