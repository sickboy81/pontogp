import assert from 'node:assert/strict'
import test from 'node:test'

import { serializeLegacyVisibilityPolicy } from './expiration-settings-payload.mjs'

test('adds the legacy unavailable alias only to the HTTP payload', () => {
  const policy = {
    blur_after_days: 7,
    remove_from_search_after_days: 30,
    archive_after_days: 90,
  }

  assert.deepEqual(serializeLegacyVisibilityPolicy(policy), {
    blur_after_days: 7,
    remove_from_search_after_days: 30,
    archive_after_days: 90,
    unavailable_after_days: 7,
  })
  assert.deepEqual(policy, {
    blur_after_days: 7,
    remove_from_search_after_days: 30,
    archive_after_days: 90,
  })
})
