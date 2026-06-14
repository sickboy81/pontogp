export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfter: number
}

export type RateLimiter = {
  consume(key: string, limit: number, windowMs: number): RateLimitResult
  cleanupExpired(): number
  size(): number
  reset(): void
}

export function getClientIp(headers: Headers): string
export function createRateLimiter(options?: { now?: () => number }): RateLimiter
export const rateLimiter: RateLimiter
