import test from 'node:test'
import assert from 'node:assert/strict'
import { getDocumentVerificationState } from './verification-document-status.mjs'

test('uses the latest approved verification request over a stale account flag', () => {
  assert.equal(
    getDocumentVerificationState(false, [
      { status: 'approved', reviewed_at: '2026-09-03 12:18:54.608Z', created: '2026-09-03 12:10:00.000Z' },
    ]),
    true
  )
})

test('uses the latest rejected verification request over an older approval', () => {
  assert.equal(
    getDocumentVerificationState(true, [
      { status: 'approved', reviewed_at: '2026-08-01 12:00:00.000Z', created: '2026-08-01 12:00:00.000Z' },
      { status: 'rejected', reviewed_at: '2026-09-01 12:00:00.000Z', created: '2026-09-01 12:00:00.000Z' },
    ]),
    false
  )
})

test('preserves the account flag only when no document review exists', () => {
  assert.equal(getDocumentVerificationState(true, []), true)
  assert.equal(getDocumentVerificationState(false, [{ status: 'pending' }]), false)
})
