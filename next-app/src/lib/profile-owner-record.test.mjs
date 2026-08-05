import test from 'node:test'
import assert from 'node:assert/strict'
import { selectOwnerProfileRecord } from './profile-owner-record.mjs'

test('selects the most recently updated profile when a user has legacy duplicates', () => {
  const selected = selectOwnerProfileRecord([
    { id: 'old-empty', updated: '2026-08-05 19:29:45.350Z', photos: [] },
    { id: 'current', updated: '2026-08-05 20:49:48.338Z', photos: ['a', 'b', 'c', 'd', 'e'] },
  ])

  assert.equal(selected?.id, 'current')
})

test('returns null when the user has no profile records', () => {
  assert.equal(selectOwnerProfileRecord([]), null)
})
