type Entry = { count: number; resetAt: number }

const buckets = new Map<string, Entry>()
const MAX_BUCKETS = 20_000
const SWEEP_INTERVAL_MS = 60_000
let lastSweepAt = 0

function sweepExpired(now: number) {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS && buckets.size < MAX_BUCKETS) return

  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key)
  }
  lastSweepAt = now

  while (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value as string | undefined
    if (!oldestKey) break
    buckets.delete(oldestKey)
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  sweepExpired(now)
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
