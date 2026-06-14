import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createRateLimiter,
  getClientIp,
} from './rate-limit.mjs'

test('allows requests until the fixed-window limit is reached', () => {
  let now = 1_000
  const limiter = createRateLimiter({ now: () => now })

  const first = limiter.consume('contact:198.51.100.1', 2, 10_000)
  const second = limiter.consume('contact:198.51.100.1', 2, 10_000)
  const blocked = limiter.consume('contact:198.51.100.1', 2, 10_000)

  assert.deepEqual(first, {
    allowed: true,
    limit: 2,
    remaining: 1,
    resetAt: 11_000,
    retryAfter: 0,
  })
  assert.equal(second.allowed, true)
  assert.equal(second.remaining, 0)
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.remaining, 0)
  assert.equal(blocked.retryAfter, 10)
})

test('starts a new bucket after the window expires', () => {
  let now = 5_000
  const limiter = createRateLimiter({ now: () => now })

  limiter.consume('pix:user-1', 1, 1_000)
  now = 6_001

  const result = limiter.consume('pix:user-1', 1, 1_000)

  assert.equal(result.allowed, true)
  assert.equal(result.remaining, 0)
  assert.equal(result.resetAt, 7_001)
})

test('removes expired buckets during cleanup', () => {
  let now = 10_000
  const limiter = createRateLimiter({ now: () => now })

  limiter.consume('old', 1, 500)
  limiter.consume('current', 1, 5_000)
  now = 10_501

  assert.equal(limiter.cleanupExpired(), 1)
  assert.equal(limiter.size(), 1)
})

test('prefers the Cloudflare client IP over forwarded proxy headers', () => {
  const headers = new Headers({
    'cf-connecting-ip': '203.0.113.10',
    'x-forwarded-for': '198.51.100.20, 10.0.0.1',
    'x-real-ip': '192.0.2.30',
  })

  assert.equal(getClientIp(headers), '203.0.113.10')
})

test('uses the first valid forwarded IP when Cloudflare header is absent', () => {
  const headers = new Headers({
    'x-forwarded-for': '198.51.100.20, 10.0.0.1',
    'x-real-ip': '192.0.2.30',
  })

  assert.equal(getClientIp(headers), '198.51.100.20')
})

test('normalizes missing or invalid IP headers to a bounded fallback key', () => {
  assert.equal(getClientIp(new Headers()), 'unknown')
  assert.equal(
    getClientIp(new Headers({ 'x-forwarded-for': 'attacker-controlled-value' })),
    'unknown'
  )
})
