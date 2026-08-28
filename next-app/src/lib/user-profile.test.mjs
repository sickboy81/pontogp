import test from 'node:test'
import assert from 'node:assert/strict'
import { canViewUserProfile, toPublicUserProfile } from './user-profile.mjs'

test('only advertisers can view another users profile', () => {
  assert.equal(canViewUserProfile({ role: 'advertiser' }, 'other-id', 'viewer-id'), true)
  assert.equal(canViewUserProfile({ role: 'user' }, 'other-id', 'viewer-id'), false)
  assert.equal(canViewUserProfile({ role: 'advertiser' }, 'viewer-id', 'viewer-id'), false)
})

test('public user profile includes optional details but excludes private account fields', () => {
  assert.deepEqual(toPublicUserProfile({ id: 'u1', name: 'Cliente', email: 'private@example.com', avatar: 'a.jpg', city: 'Rio de Janeiro', state: 'RJ', age: 29, bio: 'Gosta de conversar.', role: 'user', created: '2026-01-01 10:00:00' }), {
    id: 'u1', name: 'Cliente', avatar: 'a.jpg', city: 'Rio de Janeiro', state: 'RJ', age: 29, bio: 'Gosta de conversar.', created: '2026-01-01 10:00:00', role: 'user',
  })
})
