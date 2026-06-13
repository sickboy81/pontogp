export type AdminAccessState = 'loading' | 'login' | 'dashboard' | 'ready'

export function resolveAdminAccess(input: {
  hydrated: boolean
  authenticated: boolean
  hasUser: boolean
  hasToken: boolean
  tokenExpired: boolean
  adminRole: boolean
  serverAuthenticated: boolean | null
}): AdminAccessState
