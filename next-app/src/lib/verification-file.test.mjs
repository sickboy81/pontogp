import test from 'node:test'
import assert from 'node:assert/strict'
import { buildVerificationFilePath, isVerificationFileField } from './verification-file.mjs'

test('allows only the three verification file fields', () => {
  assert.equal(isVerificationFileField('document_front'), true)
  assert.equal(isVerificationFileField('document_back'), true)
  assert.equal(isVerificationFileField('selfie'), true)
  assert.equal(isVerificationFileField('user'), false)
})

test('builds the protected admin image URL', () => {
  assert.equal(
    buildVerificationFilePath('req123', 'document_front'),
    '/api/admin/verification/req123/file?field=document_front',
  )
  assert.equal(buildVerificationFilePath('req123', 'document'), null)
})
