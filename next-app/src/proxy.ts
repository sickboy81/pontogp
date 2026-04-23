import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthCookieFromHeader } from '@/lib/auth-cookie'

const PROTECTED_PREFIXES = ['/dashboard', '/mensagens', '/diretrizes-fotos-videos', '/admin', '/favoritos']

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function isStaticPath(pathname: string) {
  if (pathname.startsWith('/_next')) return true
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
