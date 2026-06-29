import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CEREJA_STORIES_DURATION_HOURS,
  CEREJA_STORIES_DURATION_MS,
  getCerejaStoryExpiresAt,
  getLegacyCerejaStoryCutoff,
} from './cereja-stories.mjs'

const now = new Date('2026-06-29T12:00:00.000Z')

test('Cereja Stories remain active for 24 hours', () => {
  assert.equal(CEREJA_STORIES_DURATION_HOURS, 24)
  assert.equal(CEREJA_STORIES_DURATION_MS, 86_400_000)
  assert.equal(getCerejaStoryExpiresAt(now).toISOString(), '2026-06-30T12:00:00.000Z')
  assert.equal(getLegacyCerejaStoryCutoff(now).toISOString(), '2026-06-28T12:00:00.000Z')
})
