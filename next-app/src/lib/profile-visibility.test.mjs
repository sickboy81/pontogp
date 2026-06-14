import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_PROFILE_VISIBILITY_POLICY,
  getProfileVisibilityState,
  parseProfileVisibilityPolicy,
} from './profile-visibility.mjs'

const NOW = new Date('2026-06-14T12:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

function expiredDaysAgo(days) {
  return new Date(NOW.getTime() - days * DAY_MS).toISOString()
}

const NORMAL = {
  state: 'normal',
  listed: true,
  direct: true,
  archived: false,
}
const UNAVAILABLE_LISTED = {
  state: 'unavailable',
  listed: true,
  direct: true,
  archived: false,
}
const UNAVAILABLE_DIRECT = {
  state: 'unavailable',
  listed: false,
  direct: true,
  archived: false,
}
const ARCHIVED = {
  state: 'archived',
  listed: false,
  direct: false,
  archived: true,
}

test('uses the approved default visibility policy', () => {
  assert.deepEqual(DEFAULT_PROFILE_VISIBILITY_POLICY, {
    blur_after_days: 7,
    remove_from_search_after_days: 30,
    archive_after_days: 90,
  })
})

test('keeps profiles without a valid past expiration normal', () => {
  for (const expiration of [undefined, '', 'not-a-date', expiredDaysAgo(-1)]) {
    assert.deepEqual(getProfileVisibilityState(expiration, NOW), NORMAL)
  }
})

test('keeps an expired profile normal through day 6', () => {
  assert.deepEqual(getProfileVisibilityState(expiredDaysAgo(6), NOW), NORMAL)
})

test('marks an expired profile unavailable but listed from day 7 through day 29', () => {
  assert.deepEqual(getProfileVisibilityState(expiredDaysAgo(7), NOW), UNAVAILABLE_LISTED)
  assert.deepEqual(getProfileVisibilityState(expiredDaysAgo(29), NOW), UNAVAILABLE_LISTED)
})

test('removes an unavailable profile from search from day 30 through day 89', () => {
  assert.deepEqual(getProfileVisibilityState(expiredDaysAgo(30), NOW), UNAVAILABLE_DIRECT)
  assert.deepEqual(getProfileVisibilityState(expiredDaysAgo(89), NOW), UNAVAILABLE_DIRECT)
})

test('archives an expired profile from day 90', () => {
  assert.deepEqual(getProfileVisibilityState(expiredDaysAgo(90), NOW), ARCHIVED)
})

test('accepts a custom ordered visibility policy', () => {
  const policy = {
    blur_after_days: 2,
    remove_from_search_after_days: 4,
    archive_after_days: 6,
  }

  assert.deepEqual(getProfileVisibilityState(expiredDaysAgo(2), NOW, policy), UNAVAILABLE_LISTED)
  assert.deepEqual(getProfileVisibilityState(expiredDaysAgo(4), NOW, policy), UNAVAILABLE_DIRECT)
  assert.deepEqual(getProfileVisibilityState(expiredDaysAgo(6), NOW, policy), ARCHIVED)
})

test('parses object and JSON policies into ordered integer values', () => {
  assert.deepEqual(
    parseProfileVisibilityPolicy({
      blur_after_days: 4.9,
      remove_from_search_after_days: 20.8,
      archive_after_days: 120.2,
    }),
    {
      blur_after_days: 4,
      remove_from_search_after_days: 20,
      archive_after_days: 120,
    },
  )
  assert.deepEqual(
    parseProfileVisibilityPolicy(
      JSON.stringify({
        blur_after_days: 8,
        remove_from_search_after_days: 40,
        archive_after_days: 100,
      }),
    ),
    {
      blur_after_days: 8,
      remove_from_search_after_days: 40,
      archive_after_days: 100,
    },
  )
})

test('migrates unavailable_after_days and preserves archive_after_days', () => {
  const policy = parseProfileVisibilityPolicy({
    unavailable_after_days: 12,
    archive_after_days: 80,
  })

  assert.deepEqual(policy, {
    blur_after_days: 12,
    remove_from_search_after_days: 30,
    archive_after_days: 80,
  })
  assert.equal(Object.hasOwn(policy, 'unavailable_after_days'), false)
})

test('normalizes invalid and unordered policy values within 1 and 365 days', () => {
  assert.deepEqual(parseProfileVisibilityPolicy(null), DEFAULT_PROFILE_VISIBILITY_POLICY)
  assert.deepEqual(parseProfileVisibilityPolicy('invalid-json'), DEFAULT_PROFILE_VISIBILITY_POLICY)
  assert.deepEqual(
    parseProfileVisibilityPolicy({
      blur_after_days: 400,
      remove_from_search_after_days: 1,
      archive_after_days: 2,
    }),
    {
      blur_after_days: 1,
      remove_from_search_after_days: 2,
      archive_after_days: 3,
    },
  )
  assert.deepEqual(
    parseProfileVisibilityPolicy({
      unavailable_after_days: 364,
      archive_after_days: 365,
    }),
    {
      blur_after_days: 363,
      remove_from_search_after_days: 364,
      archive_after_days: 365,
    },
  )
})
