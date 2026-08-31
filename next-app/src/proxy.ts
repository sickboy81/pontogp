import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import {
  enforceIpRateLimit,
  enforceUserRateLimit,
  RATE_LIMIT_POLICIES,
} from '@/lib/api-rate-limit.mjs'
import { resolveHomeRedirectPath } from '@/lib/seo-home'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/mensagens',
  '/diretrizes-fotos-videos',
  '/admin',
  '/favoritos',
  '/conta',
  '/notificacoes',
  '/pagamentos',
]

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function isStaticPath(pathname: string) {
  if (pathname.startsWith('/_next')) return true
  if (pathname === '/opengraph-image' || pathname === '/twitter-image') return true
  if (pathname.startsWith('/sitemap') && pathname.endsWith('.xml')) return true
  const last = pathname.split('/').pop() ?? ''
  return /\.[a-zA-Z0-9]{2,6}$/.test(last)
}

/** Adiciona Cache-Control no-store ao HTML para evitar conflito com SPA Vite antiga em cache. */
function withNoCache(res: NextResponse, pathname: string): NextResponse {
  if (!isStaticPath(pathname)) {
    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate')
  }
  return res
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''
  const forwardedProto = request.headers.get('x-forwarded-proto') || ''

  if (host === 'www.cerejavip.com' || (host === 'cerejavip.com' && forwardedProto === 'http')) {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.protocol = 'https:'
    canonicalUrl.host = 'cerejavip.com'
    canonicalUrl.port = ''
    return NextResponse.redirect(canonicalUrl, 308)
  }

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/map-tiles/')) {
    const isAdminApi = pathname.startsWith('/api/admin/')
    const token = isAdminApi
      ? getAuthCookieFromHeader(request.headers.get('cookie'))
      : null
    const userId = token ? getUserIdFromToken(token) : null
    const limited = userId
      ? enforceUserRateLimit(request, 'api-admin', userId, RATE_LIMIT_POLICIES.admin)
      : enforceIpRateLimit(
          request,
          isAdminApi ? 'api-admin' : 'api-general',
          isAdminApi ? RATE_LIMIT_POLICIES.admin : RATE_LIMIT_POLICIES.general
        )
    if (limited) return limited
  }

  if (pathname === '/' && request.nextUrl.search) {
    const redirectPath = resolveHomeRedirectPath(request.nextUrl.searchParams)
    if (redirectPath) {
      const cleanUrl = request.nextUrl.clone()
      cleanUrl.pathname = redirectPath
      cleanUrl.search = ''
      return NextResponse.redirect(cleanUrl, 308)
    }
  }

  // Reescreve /@username -> /username mantendo URL pública com @.
  if (pathname.startsWith('/@') && pathname.length > 2) {
    const slug = pathname.slice(2)
    if (slug && !slug.includes('/')) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = `/${slug}`
      rewriteUrl.searchParams.set('__at', '1')
      return withNoCache(NextResponse.rewrite(rewriteUrl), pathname)
    }
  }

  if (isProtected(pathname)) {
    const cookieHeader = request.headers.get('cookie')
    const token = getAuthCookieFromHeader(cookieHeader)
    if (!token) {
      const login = new URL('/login', request.url)
      login.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(login)
    }
  }

  return withNoCache(NextResponse.next(), pathname)
}

export const config = {
  matcher: [
    /*
     * Executa em quase todas as rotas:
     *  - trata /@username
     *  - aplica no-cache ao HTML para expulsar builds Vite antigas em cache
     *  - protege rotas autenticadas
     * Exclui assets estáticos e otimizações de imagem.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
  ],
}
