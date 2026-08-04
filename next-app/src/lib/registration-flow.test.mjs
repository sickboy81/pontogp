import test from 'node:test'
import assert from 'node:assert/strict'
import * as registrationFlow from './registration-flow.mjs'

test('sends advertisers to login with the profile editor as callback', () => {
  assert.equal(
    registrationFlow.getRegistrationNextUrl?.('advertiser'),
    '/login?callbackUrl=%2Fdashboard%2Fperfil'
  )
})

test('sends clients to login with the dashboard as callback', () => {
  assert.equal(
    registrationFlow.getRegistrationNextUrl?.('user'),
    '/login?callbackUrl=%2Fdashboard'
  )
})
