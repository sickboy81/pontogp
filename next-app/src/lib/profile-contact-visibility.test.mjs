import assert from 'node:assert/strict'
import test from 'node:test'

import { getProfileContactVisibilityState } from './profile-contact-visibility.mjs'

const NOW = new Date('2026-06-14T12:00:00.000Z')

test('allows profile contact entry points before contact expiration', () => {
  assert.deepEqual(
    getProfileContactVisibilityState('2026-06-15T12:00:00.000Z', NOW),
    {
      contactExpired: false,
      canStartMessage: true,
      showCustomBioLinks: true,
    },
  )
})

test('blocks new profile contact entry points after contact expiration', () => {
  assert.deepEqual(
    getProfileContactVisibilityState('2026-06-14T11:59:59.000Z', NOW),
    {
      contactExpired: true,
      canStartMessage: false,
      showCustomBioLinks: false,
    },
  )
})

test('keeps contact entry points available without a valid expiration', () => {
  for (const expiration of [undefined, '', 'invalid-date']) {
    assert.deepEqual(
      getProfileContactVisibilityState(expiration, NOW),
      {
        contactExpired: false,
        canStartMessage: true,
        showCustomBioLinks: true,
      },
    )
  }
})
