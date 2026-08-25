export const DEFAULT_NOTIFICATION_PREFERENCES = Object.freeze({
  notify_messages: true,
  notify_payments: true,
  notify_plan_expiry: true,
  notify_security: true,
})

export function normalizeNotificationPreferences(value = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_NOTIFICATION_PREFERENCES).map(([key, fallback]) => [key, typeof value[key] === 'boolean' ? value[key] : fallback])
  )
}

export function selectCurrentPlan(records = []) {
  const active = records
    .filter((record) => ['approved', 'active', 'pending'].includes(String(record.status || '').toLowerCase()))
    .sort((a, b) => String(b.created || '').localeCompare(String(a.created || '')))
  return active[0] || null
}
