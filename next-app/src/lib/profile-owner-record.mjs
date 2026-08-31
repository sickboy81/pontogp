/** Seleciona o rascunho mais recente quando existem duplicatas históricas. */
export function selectOwnerProfileRecord(records) {
  if (!Array.isArray(records) || records.length === 0) return null
  return records.reduce((latest, record) => {
    const latestTime = Date.parse(String(latest?.updated || latest?.created || ''))
    const recordTime = Date.parse(String(record?.updated || record?.created || ''))
    return Number.isFinite(recordTime) && (!Number.isFinite(latestTime) || recordTime > latestTime)
      ? record
      : latest
  }, records[0])
}

/**
 * Valida o JWT no PocketBase antes de usar credenciais internas para consultar
 * um perfil do próprio usuário. Isso permite editar rascunhos sem confiar no
 * conteúdo não verificado do token nem nas regras públicas da coleção.
 */
export async function authorizeProfileOwner({
  pbUrl,
  profileId,
  sessionToken,
  fields = 'id,user',
  fetchImpl = fetch,
  getAdminTokenImpl,
}) {
  const sessionRes = await fetchImpl(`${pbUrl}/api/collections/users/auth-refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}` },
    cache: 'no-store',
  })
  if (!sessionRes.ok) {
    return { ok: false, status: 401, error: 'Sessão inválida. Entre novamente.' }
  }

  const session = await sessionRes.json()
  const userId = String(session?.record?.id || '')
  if (!userId) {
    return { ok: false, status: 401, error: 'Sessão inválida. Entre novamente.' }
  }

  const adminToken = await getAdminTokenImpl()
  if (!adminToken) {
    return { ok: false, status: 503, error: 'Serviço de perfis indisponível. Tente novamente em instantes.' }
  }

  const profileRes = await fetchImpl(
    `${pbUrl}/api/collections/profiles/records/${encodeURIComponent(profileId)}?fields=${encodeURIComponent(fields)}`,
    { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' },
  )
  if (!profileRes.ok) {
    if (profileRes.status === 404) return { ok: false, status: 404, error: 'Perfil não encontrado.' }
    return { ok: false, status: 503, error: 'Não foi possível consultar o perfil agora.' }
  }

  const profile = await profileRes.json()
  if (String(profile?.user || '') !== userId) {
    return { ok: false, status: 403, error: 'Sem permissão para alterar este perfil.' }
  }

  return { ok: true, userId, profile, adminToken }
}
