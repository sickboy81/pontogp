export type AuthorizedSession =
  | {
      ok: true
      userId: string
      user: Record<string, unknown>
      adminToken: string
    }
  | {
      ok: false
      status: number
      error: string
    }

export function authorizeSession(options: {
  pbUrl: string
  sessionToken: string | null
  fetchImpl?: typeof fetch
  getAdminTokenImpl: () => Promise<string | null>
}): Promise<AuthorizedSession>
