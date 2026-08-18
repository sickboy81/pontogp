const SAFE_EVENT_KEYS = [
  'event_id',
  'timestamp',
  'level',
  'platform',
  'logger',
  'release',
  'environment',
  'transaction',
  'message',
  'exception',
  'tags',
  'fingerprint',
]

function sanitizeText(value) {
  if (typeof value !== 'string') return value

  return value
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/(token|secret|password|authorization|cookie|email|cpf|phone|document)[=:]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .slice(0, 500)
}

function sanitizeException(exception) {
  if (!exception || typeof exception !== 'object') return undefined

  const values = Array.isArray(exception.values)
    ? exception.values
      .filter((value) => value && typeof value === 'object')
      .slice(0, 5)
      .map((value) => ({
        ...(typeof value.type === 'string' ? { type: sanitizeText(value.type) } : {}),
        ...(typeof value.value === 'string' ? { value: sanitizeText(value.value) } : {}),
        ...(typeof value.mechanism?.type === 'string'
          ? { mechanism: { type: sanitizeText(value.mechanism.type) } }
          : {}),
      }))
    : undefined

  return values?.length ? { values } : undefined
}

/**
 * Keeps only technical event fields. Request payloads, headers, cookies,
 * user identity, breadcrumbs, contexts, extras and attachments are dropped.
 */
export function sanitizeSentryEvent(event) {
  if (!event || typeof event !== 'object') return null

  const sanitized = {}
  for (const key of SAFE_EVENT_KEYS) {
    if (!(key in event)) continue
    if (key === 'exception') {
      const exception = sanitizeException(event.exception)
      if (exception) sanitized.exception = exception
    } else if (key === 'message' || key === 'transaction' || key === 'logger') {
      if (typeof event[key] === 'string') sanitized[key] = sanitizeText(event[key])
    } else if (key === 'tags' && event.tags && typeof event.tags === 'object') {
      sanitized.tags = Object.fromEntries(
        Object.entries(event.tags)
          .filter(([name, value]) => typeof value === 'string' && /^(route|feature|runtime|status|method)$/.test(name))
          .map(([name, value]) => [name, sanitizeText(value)]),
      )
    } else if (key === 'fingerprint' && Array.isArray(event.fingerprint)) {
      sanitized.fingerprint = event.fingerprint.filter((value) => typeof value === 'string').slice(0, 5).map(sanitizeText)
    } else {
      sanitized[key] = event[key]
    }
  }

  return sanitized
}
