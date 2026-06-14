import test from 'node:test'
import assert from 'node:assert/strict'
import {
  RATE_LIMIT_POLICIES,
  createRateLimitResponse,
  enforceIpRateLimit,
  enforceUserRateLimit,
} from './api-rate-limit.mjs'
import { rateLimiter } from './rate-limit.mjs'

test('defines named policies for each protected API category', () => {
  for (const name of [
    'general',
    'contact',
    'registration',
    'pix',
    'write',
    'upload',
    'admin',
    'webhook',
  ]) {
    assert.ok(RATE_LIMIT_POLICIES[name])
    assert.ok(RATE_LIMIT_POLICIES[name].limit > 0)
    assert.ok(RATE_LIMIT_POLICIES[name].windowMs > 0)
  }
})

test('creates a standard 429 response with retry metadata', async () => {
  const response = createRateLimitResponse({
    allowed: false,
    limit: 5,
    remaining: 0,
    resetAt: 12_000,
    retryAfter: 7,
  })

  assert.equal(response.status, 429)
  assert.equal(response.headers.get('Retry-After'), '7')
  assert.equal(response.headers.get('RateLimit-Limit'), '5')
  assert.equal(response.headers.get('RateLimit-Remaining'), '0')
  assert.equal(response.headers.get('RateLimit-Reset'), '12')
  assert.deepEqual(await response.json(), {
    error: 'Muitas requisições. Aguarde e tente novamente.',
  })
})

test('enforces an IP policy and returns null while requests are allowed', () => {
  rateLimiter.reset()
  const request = new Request('https://cerejavip.com/api/contact', {
    headers: { 'cf-connecting-ip': '203.0.113.50' },
  })
  const policy = { limit: 1, windowMs: 60_000 }

  assert.equal(enforceIpRateLimit(request, 'test', policy), null)
  assert.equal(enforceIpRateLimit(request, 'test', policy)?.status, 429)
})

test('checks the IP before creating buckets for attacker-controlled user IDs', () => {
  rateLimiter.reset()
  const request = new Request('https://cerejavip.com/api/admin/session', {
    headers: { 'cf-connecting-ip': '203.0.113.70' },
  })
  const policy = { limit: 1, windowMs: 60_000 }

  assert.equal(enforceUserRateLimit(request, 'admin-test', 'user-1', policy), null)
  assert.equal(
    enforceUserRateLimit(request, 'admin-test', 'attacker-controlled-user-2', policy)?.status,
    429
  )
  assert.equal(rateLimiter.size(), 2)
})
