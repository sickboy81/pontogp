import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthCookieFromHeader } from '@/lib/auth-cookie'

const PROTECTED_PREFIXES = ['/dashboard', '/mensagens', '/diretrizes-fotos-videos', '/admin', '/favoritos']

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Reescreve /@username -> /username mantendo URL pública com @.
  // Isso evita 404 em ambientes onde o matcher de rota não resolve "@" diretamente.
  if (pathname.startsWith('/@') && pathname.length > 2) {
    const slug = pathname.slice(2)
    if (slug && !slug.includes('/')) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = `/${slug}`
      rewriteUrl.searchParams.set('__at', '1')
      return NextResponse.rewrite(rewriteUrl)
    }
  }

  if (!isProtected(pathname)) return NextResponse.next()

  const cookieHeader = request.headers.get('cookie')
  const token = getAuthCookieFromHeader(cookieHeader)
  if (!token) {
    const login = new URL('/login', request.url)
    login.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/@:path*',
    '/dashboard/:path*',
    '/mensagens/:path*',
    '/diretrizes-fotos-videos/:path*',
    '/admin/:path*',
    '/favoritos',
  ],
}
