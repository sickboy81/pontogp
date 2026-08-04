import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveProtectedAccess } from './protected-access.mjs'

test('keeps protected UI loading until persisted authentication hydrates', () => {
  assert.equal(
    resolveProtectedAccess({ hydrated: false, authenticated: false }),
    'loading'
  )
})

test('redirects only after hydration confirms there is no session', () => {
  assert.equal(
    resolveProtectedAccess({ hydrated: true, authenticated: false }),
    'login'
  )
})

test('allows protected UI after hydration restores the session', () => {
  assert.equal(
    resolveProtectedAccess({ hydrated: true, authenticated: true }),
    'ready'
  )
})
