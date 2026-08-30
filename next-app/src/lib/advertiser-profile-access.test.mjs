import test from 'node:test'
import assert from 'node:assert/strict'
import { filterAdvertiserProfiles, isAdvertiserRole } from './advertiser-profile-access.mjs'

test('only advertiser accounts can own an advertiser profile', () => {
  assert.equal(isAdvertiserRole('advertiser'), true)
  assert.equal(isAdvertiserRole('user'), false)
  assert.equal(isAdvertiserRole('admin'), false)
})

test('admin profile data excludes profiles owned by users or missing owners', () => {
  const result = filterAdvertiserProfiles([
    { id: 'ad-1', expand: { user: { role: 'advertiser' } } },
    { id: 'user-1', expand: { user: { role: 'user' } } },
    { id: 'missing-owner', expand: {} },
  ])

  assert.deepEqual(result.map((item) => item.id), ['ad-1'])
})
