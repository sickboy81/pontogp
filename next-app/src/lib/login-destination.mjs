import { canAccessAccountPath } from './account-navigation.mjs'

function normalizeInternalDestination(callbackUrl) {
  const destination = String(callbackUrl || '').trim()

  if (!destination.startsWith('/') || destination.startsWith('//') || destination.includes('\\')) {
    return '/dashboard'
  }

  return destination
}

export function resolveLoginDestination(role, callbackUrl) {
  const normalizedRole = String(role || '').trim().toLowerCase()

  if (normalizedRole === 'admin' || normalizedRole === 'administrator' || normalizedRole === '1') {
    return '/admin'
  }

  if (normalizedRole === 'advertiser') {
    return '/dashboard'
  }

  const destination = normalizeInternalDestination(callbackUrl)
  return canAccessAccountPath('user', destination) ? destination : '/dashboard'
}
