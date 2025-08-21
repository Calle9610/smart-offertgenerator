import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Publika rutter som inte kräver autentisering
const publicRoutes = [
  '/',
  '/login',
  '/public',
  '/quote', // Publika offert-sidor
  '/api/public', // Publika API-endpoints
]

// Skyddade rutter som kräver autentisering
const protectedRoutes = [
  '/admin',
  '/dashboard',
  '/quotes',
  '/customers',
  '/settings',
  '/auto-tuning',
  '/templates',
]

/**
 * Kontrollera om en route är publik
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route))
}

/**
 * Kontrollera om en route är skyddad
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

/**
 * Middleware för att hantera autentisering
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Publika rutter - låt passera
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Skyddade rutter - kontrollera cookies
  if (isProtectedRoute(pathname)) {
    const accessToken = request.cookies.get('access_token')
    const refreshToken = request.cookies.get('refresh_token')

    // Om ingen auth-cookie finns, redirect till login
    if (!accessToken && !refreshToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Auth-cookies finns, låt passera
    return NextResponse.next()
  }

  // Övriga rutter - låt passera (komponenterna hanterar auth själva)
  return NextResponse.next()
}

/**
 * Konfigurera vilka rutter som ska gå genom middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
