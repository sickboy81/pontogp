export async function authorizeSession({
  pbUrl,
  sessionToken,
  fetchImpl = fetch,
  getAdminTokenImpl,
}) {
  if (!sessionToken) {
    return { ok: false, status: 401, error: 'Sessão inválida. Entre novamente.' }
  }

  const sessionRes = await fetchImpl(`${pbUrl}/api/collections/users/auth-refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}` },
    cache: 'no-store',
  })
  if (!sessionRes.ok) {
    return { ok: false, status: 401, error: 'Sessão inválida. Entre novamente.' }
  }

  const session = await sessionRes.json()
  const user = session?.record
  const userId = String(user?.id || '')
  if (!userId) {
    return { ok: false, status: 401, error: 'Sessão inválida. Entre novamente.' }
  }

  const adminToken = await getAdminTokenImpl()
  if (!adminToken) {
    return { ok: false, status: 503, error: 'Serviço indisponível. Tente novamente em instantes.' }
  }

  return { ok: true, userId, user, adminToken }
}
