import test from 'node:test'
import assert from 'node:assert/strict'
import { filterAdvertiserProfiles, isAdvertiserRole } from './advertiser-profile-access.mjs'

test('advertisers and administrators can own an advertiser profile', () => {
  assert.equal(isAdvertiserRole('advertiser'), true)
  assert.equal(isAdvertiserRole('admin'), true)
  assert.equal(isAdvertiserRole('administrator'), true)
  assert.equal(isAdvertiserRole('1'), true)
  assert.equal(isAdvertiserRole('user'), false)
})

test('admin profile data keeps advertiser and admin owners but excludes users and missing owners', () => {
  const result = filterAdvertiserProfiles([
    { id: 'ad-1', expand: { user: { role: 'advertiser' } } },
    { id: 'admin-ad', expand: { user: { role: 'admin' } } },
    { id: 'user-1', expand: { user: { role: 'user' } } },
    { id: 'missing-owner', expand: {} },
  ])

  assert.deepEqual(result.map((item) => item.id), ['ad-1', 'admin-ad'])
})
