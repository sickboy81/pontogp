export function resolveAdminAccess({
  hydrated,
  authenticated,
  hasUser,
  hasToken,
  tokenExpired,
  adminRole,
  serverAuthenticated,
}) {
  if (!hydrated) return 'loading'
  if (!authenticated || !hasUser || !hasToken || tokenExpired) return 'login'
  if (!adminRole) return 'dashboard'
  if (serverAuthenticated === null) return 'loading'
  return serverAuthenticated ? 'ready' : 'login'
}
