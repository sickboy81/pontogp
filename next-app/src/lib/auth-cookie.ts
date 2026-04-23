/** Cookie usado pelo middleware para checar auth sem acessar localStorage. */

const COOKIE_NAME = 'cerejavip_token'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function getCookieBaseAttributes() {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const attrs = [`path=/`, `max-age=${COOKIE_MAX_AGE_SECONDS}`, 'samesite=lax']
  if (secure) attrs.push('secure')
  return attrs.join(';')
}

export function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)};${getCookieBaseAttributes()}`
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? ';secure' : ''
  document.cookie = `${COOKIE_NAME}=;path=/;max-age=0;samesite=lax${secure}`
}

export function getAuthCookieFromHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

/** Decodifica o JWT do PocketBase e retorna o userId (payload.id). Apenas leitura, sem verificar assinatura. */
export function getTokenPayload(
  token: string
): { id?: string; exp?: number; iat?: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      id?: string
      exp?: number
      iat?: number
    }
    return payload
  } catch {
    return null
  }
}

/** Decodifica o JWT do PocketBase e retorna o userId (payload.id). Apenas leitura, sem verificar assinatura. */
export function getUserIdFromToken(token: string): string | null {
  return getTokenPayload(token)?.id ?? null
}
