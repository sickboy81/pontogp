const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

let cachedToken: string | null = null
let cachedTokenExpMs = 0

function getJwtExpMs(token: string): number {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return 0
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { exp?: number }
    if (!payload.exp) return 0
    return payload.exp * 1000
  } catch {
    return 0
  }
}

/** Token de admin para operações server-side (view/click counts, etc.). */
export async function getAdminToken(): Promise<string | null> {
  const now = Date.now()
  if (cachedToken && cachedTokenExpMs - now > 60_000) {
    return cachedToken
  }

  const email = process.env.POCKETBASE_ADMIN_EMAIL
  const password = process.env.POCKETBASE_ADMIN_PASSWORD
  if (!email || !password) return null

  try {
    // PB v0.23+: superusers; fallback para v0.22-: admins
    let res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password }),
    })
    if (!res.ok) {
      res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password }),
      })
    }
    if (!res.ok) return null
    const json = (await res.json()) as { token?: string }
    const token = json.token ?? null
    if (!token) return null
    cachedToken = token
    cachedTokenExpMs = getJwtExpMs(token) || now + 10 * 60 * 1000
    return token
  } catch {
    return null
  }
}
