import test from 'node:test'
import assert from 'node:assert/strict'
import { getLoginErrorMessage, shouldOfferVerificationResend } from './login-error.mjs'

test('generic PocketBase authentication failures mention credentials and pending confirmation', () => {
  assert.match(getLoginErrorMessage({ status: 400 }), /Email ou senha incorretos/)
  assert.match(getLoginErrorMessage({ status: 400 }), /confirmado/)
  assert.equal(shouldOfferVerificationResend({ status: 400 }), true)
  assert.equal(shouldOfferVerificationResend({ status: 401 }), true)
})

test('explicit verification failures keep the confirmation guidance', () => {
  assert.match(getLoginErrorMessage({ status: 403 }), /Confirme seu email/)
  assert.equal(shouldOfferVerificationResend({ status: 403 }), true)
  assert.equal(shouldOfferVerificationResend({ status: 429 }), false)
  assert.equal(shouldOfferVerificationResend({ status: 0 }), false)
})
