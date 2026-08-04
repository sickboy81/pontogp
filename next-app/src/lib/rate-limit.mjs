function isValidIpv4(value) {
  const parts = value.split('.')
  return (
    parts.length === 4 &&
    parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  )
}

function isValidIpv6(value) {
  return (
    value.length <= 45 &&
    value.includes(':') &&
    /^[0-9a-f:]+$/i.test(value) &&
    !value.includes(':::')
  )
}

function normalizeIp(value) {
  const candidate = String(value || '').trim().replace(/^\[|\]$/g, '')
  return isValidIpv4(candidate) || isValidIpv6(candidate) ? candidate.toLowerCase() : null
}

export function getClientIp(headers) {
  const cloudflareIp = normalizeIp(headers.get('cf-connecting-ip'))
  if (cloudflareIp) return cloudflareIp

  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const forwardedIp = normalizeIp(forwarded.split(',')[0])
    if (forwardedIp) return forwardedIp
  }

  return normalizeIp(headers.get('x-real-ip')) || 'unknown'
}

export function createRateLimiter({ now = Date.now } = {}) {
  const buckets = new Map()
  let operations = 0

  function cleanupExpired() {
    const currentTime = now()
    let removed = 0
    for (const [key, entry] of buckets) {
      if (entry.resetAt <= currentTime) {
        buckets.delete(key)
        removed += 1
      }
    }
    return removed
  }

  function consume(key, limit, windowMs) {
    const currentTime = now()
    operations += 1
    if (operations % 256 === 0) cleanupExpired()

    const previous = buckets.get(key)
    if (!previous || previous.resetAt <= currentTime) {
      const resetAt = currentTime + windowMs
      buckets.set(key, { count: 1, resetAt })
      return {
        allowed: true,
        limit,
        remaining: Math.max(0, limit - 1),
        resetAt,
        retryAfter: 0,
      }
    }

    if (previous.count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: previous.resetAt,
        retryAfter: Math.max(1, Math.ceil((previous.resetAt - currentTime) / 1000)),
      }
    }

    previous.count += 1
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - previous.count),
      resetAt: previous.resetAt,
      retryAfter: 0,
    }
  }

  return {
    consume,
    cleanupExpired,
    size: () => buckets.size,
    reset: () => buckets.clear(),
  }
}

const globalKey = Symbol.for('cerejavip.rateLimiter')
const globalStore = globalThis

if (!globalStore[globalKey]) {
  globalStore[globalKey] = createRateLimiter()
}

export const rateLimiter = globalStore[globalKey]
