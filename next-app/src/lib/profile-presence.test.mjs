import assert from 'node:assert/strict'
import test from 'node:test'

import { isProfileEffectivelyOnline } from './profile-presence.mjs'

const now = new Date('2026-06-14T12:00:00Z')

test('treats expired and invalid presence as offline', () => {
  assert.equal(isProfileEffectivelyOnline(true, '2026-06-14T11:59:59Z', now), false)
  assert.equal(isProfileEffectivelyOnline(true, 'invalid', now), false)
})

test('supports explicit online without a deadline', () => {
  assert.equal(isProfileEffectivelyOnline(true, '', now), true)
})

test('keeps future presence online and explicit offline disabled', () => {
  assert.equal(isProfileEffectivelyOnline(true, '2026-06-14T12:30:00Z', now), true)
  assert.equal(isProfileEffectivelyOnline(false, '2026-06-14T12:30:00Z', now), false)
})
