import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getTokenPayload } from '@/lib/auth-cookie'
import { isAdminRole } from '@/lib/auth-roles'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

/** Retorna o token do request ou null. */
export function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** Verifica se o request é de um admin. Retorna { token, userId } ou null. */
export async function requireAdmin(
  request: NextRequest
): Promise<{ token: string; userId: string } | null> {
  const token = getToken(request)
  if (!token) return null
  const payload = getTokenPayload(token)
  const userId = payload?.id ?? null
  if (!userId) return null
  const nowInSeconds = Math.floor(Date.now() / 1000)
  if (payload?.exp && payload.exp <= nowInSeconds) return null
  try {
    const res = await fetch(`${PB_URL}/api/collections/users/records/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const user = (await res.json()) as { role?: string; status?: string }
    if (user.status && user.status !== 'active') return null
    if (!isAdminRole(user.role)) return null
    return { token, userId }
  } catch {
    return null
  }
}
