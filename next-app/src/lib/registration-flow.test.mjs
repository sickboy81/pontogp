import test from 'node:test'
import assert from 'node:assert/strict'
import * as registrationFlow from './registration-flow.mjs'

test('sends advertisers to the confirmation screen with their email and role', () => {
  assert.equal(
    registrationFlow.getRegistrationNextUrl?.('advertiser', 'acompanhar@example.com'),
    '/verificar-email-pendente?tipo=advertiser&email=acompanhar%40example.com'
  )
})

test('sends clients to the confirmation screen with their email and role', () => {
  assert.equal(
    registrationFlow.getRegistrationNextUrl?.('user', 'cliente@example.com'),
    '/verificar-email-pendente?tipo=user&email=cliente%40example.com'
  )
})
