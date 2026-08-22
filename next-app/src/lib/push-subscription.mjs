export function isValidPushSubscription(value) {
  return Boolean(value && typeof value.endpoint === 'string' && value.endpoint.startsWith('https://') && value.keys && typeof value.keys.p256dh === 'string' && typeof value.keys.auth === 'string')
}

export function pushSubscriptionPayload(value, userId) {
  return { user: userId, endpoint: value.endpoint, p256dh: value.keys.p256dh, auth: value.keys.auth, user_agent: '', last_seen_at: new Date().toISOString() }
}
