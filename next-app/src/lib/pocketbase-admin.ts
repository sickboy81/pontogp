const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

/** Token de admin para operações server-side (view/click counts, etc.). */
export async function getAdminToken(): Promise<string | null> {
  const email = process.env.POCKETBASE_ADMIN_EMAIL
  const password = process.env.POCKETBASE_ADMIN_PASSWORD
  if (!email || !password) return null

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
  return json.token ?? null
}
