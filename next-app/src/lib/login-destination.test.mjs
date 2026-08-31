import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveLoginDestination } from './login-destination.mjs'

test('keeps role-specific destinations after login', () => {
  assert.equal(resolveLoginDestination('admin', '/favoritos'), '/admin')
  assert.equal(resolveLoginDestination('advertiser', '/favoritos'), '/dashboard')
  assert.equal(resolveLoginDestination('user', '/favoritos'), '/favoritos')
})

test('rejects external and advertiser-only callbacks for regular users', () => {
  assert.equal(resolveLoginDestination('user', 'https://evil.example'), '/dashboard')
  assert.equal(resolveLoginDestination('user', '//evil.example'), '/dashboard')
  assert.equal(resolveLoginDestination('user', '/dashboard/perfil'), '/dashboard')
  assert.equal(resolveLoginDestination('user', '/pagamentos'), '/dashboard')
})
