import type { RateLimitResult } from './rate-limit.mjs'

export type RateLimitPolicy = {
  limit: number
  windowMs: number
}

export const RATE_LIMIT_POLICIES: Readonly<
  Record<
    'general' | 'contact' | 'registration' | 'pix' | 'write' | 'upload' | 'admin' | 'webhook',
    Readonly<RateLimitPolicy>
  >
>

export function createRateLimitResponse(result: RateLimitResult): Response
export function enforceIpRateLimit(
  request: Request,
  scope: string,
  policy: RateLimitPolicy
): Response | null
export function enforceUserRateLimit(
  request: Request,
  scope: string,
  userId: string,
  policy: RateLimitPolicy
): Response | null
