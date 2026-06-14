import assert from 'node:assert/strict'
import test from 'node:test'

import {
  mergeVisibilityPolicyInput,
  serializeLegacyVisibilityPolicy,
  validateCanonicalVisibilityPolicyOrder,
} from './expiration-settings-payload.mjs'

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

test('preserves the canonical search removal threshold for a legacy round trip', () => {
  const current = {
    blur_after_days: 12,
    remove_from_search_after_days: 40,
    archive_after_days: 80,
  }

  assert.deepEqual(
    mergeVisibilityPolicyInput(
      {
        unavailable_after_days: 12,
        archive_after_days: 80,
      },
      current,
    ),
    current,
  )
})

test('validates canonical policy order without rejecting legacy payloads', () => {
  assert.equal(
    validateCanonicalVisibilityPolicyOrder({
      blur_after_days: 7,
      remove_from_search_after_days: 30,
      archive_after_days: 90,
    }),
    true,
  )
  assert.equal(
    validateCanonicalVisibilityPolicyOrder({
      blur_after_days: 30,
      remove_from_search_after_days: 30,
      archive_after_days: 90,
    }),
    false,
  )
  assert.equal(
    validateCanonicalVisibilityPolicyOrder({
      unavailable_after_days: 30,
      archive_after_days: 90,
    }),
    true,
  )
})
