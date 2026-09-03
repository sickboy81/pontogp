import test from 'node:test'
import assert from 'node:assert/strict'
import { getVerificationReviewSubjectUpdates } from './verification-review-sync.mjs'

test('marks both the profile and account document as verified after approval', () => {
  assert.deepEqual(getVerificationReviewSubjectUpdates('approved'), {
    profile: { verified: true },
    user: { document_verified: true },
  })
})

test('removes verification from both the profile and account after rejection', () => {
  assert.deepEqual(getVerificationReviewSubjectUpdates('rejected'), {
    profile: { verified: false },
    user: { document_verified: false },
  })
})

test('does not alter verification subjects for a pending request', () => {
  assert.equal(getVerificationReviewSubjectUpdates('pending'), null)
})
