export function resolveProtectedAccess({ hydrated, authenticated }) {
  if (!hydrated) return 'loading'
  return authenticated ? 'ready' : 'login'
}
