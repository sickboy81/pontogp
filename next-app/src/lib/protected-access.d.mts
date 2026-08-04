export type ProtectedAccessState = 'loading' | 'login' | 'ready'

export function resolveProtectedAccess(input: {
  hydrated: boolean
  authenticated: boolean
}): ProtectedAccessState
