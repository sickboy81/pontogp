import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveAdminAccess } from './admin-access.mjs'

test('keeps admin UI blocked while server validation is pending', () => {
  assert.equal(
    resolveAdminAccess({
      hydrated: true,
      authenticated: true,
      hasUser: true,
      hasToken: true,
      tokenExpired: false,
      adminRole: true,
      serverAuthenticated: null,
    }),
    'loading'
  )
})

test('redirects stale persisted admin session to login', () => {
  assert.equal(
    resolveAdminAccess({
      hydrated: true,
      authenticated: true,
      hasUser: true,
      hasToken: true,
      tokenExpired: false,
      adminRole: true,
      serverAuthenticated: false,
    }),
    'login'
  )
})

test('allows admin UI only after server validation succeeds', () => {
  assert.equal(
    resolveAdminAccess({
      hydrated: true,
      authenticated: true,
      hasUser: true,
      hasToken: true,
      tokenExpired: false,
      adminRole: true,
      serverAuthenticated: true,
    }),
    'ready'
  )
})

test('redirects non-admin users to dashboard without server access', () => {
  assert.equal(
    resolveAdminAccess({
      hydrated: true,
      authenticated: true,
      hasUser: true,
      hasToken: true,
      tokenExpired: false,
      adminRole: false,
      serverAuthenticated: null,
    }),
    'dashboard'
  )
})
