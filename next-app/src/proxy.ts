import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthCookieFromHeader } from '@/lib/auth-cookie'

const PROTECTED_PREFIXES = ['/dashboard', '/mensagens', '/diretrizes-fotos-videos', '/admin', '/favoritos']

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
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
  matcher: ['/dashboard/:path*', '/mensagens/:path*', '/diretrizes-fotos-videos/:path*', '/admin/:path*', '/favoritos'],
}
