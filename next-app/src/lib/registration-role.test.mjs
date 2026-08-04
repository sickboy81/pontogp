import assert from 'node:assert/strict'
import test from 'node:test'

import { parseRegistrationRole } from './registration-role.mjs'

test('accepts only advertiser and user roles', () => {
  assert.equal(parseRegistrationRole('advertiser'), 'advertiser')
  assert.equal(parseRegistrationRole('user'), 'user')
  assert.equal(parseRegistrationRole('admin'), null)
  assert.equal(parseRegistrationRole(null), null)
})
