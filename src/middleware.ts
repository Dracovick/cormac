import { NextRequest, NextResponse } from 'next/server'

const COOKIE = 'cormac_auth'
const TOKEN = 'granted'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  if (request.cookies.get(COOKIE)?.value === TOKEN) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
