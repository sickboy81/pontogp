import { getClientIp, rateLimiter } from './rate-limit.mjs'

const minute = 60 * 1000

export const RATE_LIMIT_POLICIES = Object.freeze({
  general: Object.freeze({ limit: 600, windowMs: minute }),
  contact: Object.freeze({ limit: 5, windowMs: 10 * minute }),
  registration: Object.freeze({ limit: 8, windowMs: 60 * minute }),
  pix: Object.freeze({ limit: 10, windowMs: 10 * minute }),
  write: Object.freeze({ limit: 60, windowMs: minute }),
  upload: Object.freeze({ limit: 12, windowMs: 10 * minute }),
  admin: Object.freeze({ limit: 300, windowMs: minute }),
  webhook: Object.freeze({ limit: 240, windowMs: minute }),
})

export function createRateLimitResponse(result) {
  return Response.json(
    { error: 'Muitas requisições. Aguarde e tente novamente.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter),
        'RateLimit-Limit': String(result.limit),
        'RateLimit-Remaining': String(result.remaining),
        'RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        'Cache-Control': 'no-store',
      },
    }
  )
}

function consume(key, policy) {
  try {
    return rateLimiter.consume(key, policy.limit, policy.windowMs)
  } catch (error) {
    console.error('[rate-limit] Falha ao avaliar limite; requisicao liberada.', error)
    return null
  }
}

export function enforceIpRateLimit(request, scope, policy) {
  const ip = getClientIp(request.headers)
  const result = consume(`${scope}:ip:${ip}`, policy)
  return result && !result.allowed ? createRateLimitResponse(result) : null
}

export function enforceUserRateLimit(request, scope, userId, policy) {
  const ipResponse = enforceIpRateLimit(request, scope, policy)
  if (ipResponse) return ipResponse

  const userResult = consume(`${scope}:user:${userId}`, policy)
  return userResult && !userResult.allowed ? createRateLimitResponse(userResult) : null
}
