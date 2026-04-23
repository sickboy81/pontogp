type Entry = { count: number; resetAt: number }

const buckets = new Map<string, Entry>()

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const prev = buckets.get(key)

  if (!prev || prev.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (prev.count >= limit) return false
  prev.count += 1
  buckets.set(key, prev)
  return true
}
