/**
 * Next.js Middleware for Route Protection
 *
 * Protects community features from unauthenticated access.
 * Public routes (blog, about, auth) remain accessible to everyone.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// JWT secret (must match lib/auth.ts)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/venues',
  '/venueDetails',
  '/submit',
  '/curator',
  '/events',
  '/profile',
  '/account',
  '/leaderboard',
  '/dashboard',
  '/community',
  '/referrals',
  '/musicians',
  '/admin',
]

// Routes that are always public (auth flow)
const PUBLIC_ROUTES = [
  '/',
  '/blog',
  '/tags',
  '/about',
  '/projects',
  '/auth',
  '/api',
  '/_next',
  '/static',
  '/favicon',
]

/**
 * Check if a path matches any of the route patterns
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname === route || pathname.startsWith(`${route}/`)
  })
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  // Set a client-readable auth signal on every response.
  // auth_token is HttpOnly so JavaScript can't read it. auth_active is a
  // non-sensitive companion cookie that lets client code (e.g. wagmi storage
  // adapter) know whether the user has a valid session, preventing the Reown
  // SIWE popup for unauthenticated visitors.
  const setAuthActiveCookie = (response: NextResponse, active: boolean) => {
    if (active) {
      response.cookies.set('auth_active', '1', {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
      })
    } else {
      response.cookies.delete('auth_active')
    }
    return response
  }

  // Public routes — no auth check needed, but still set/clear auth_active
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    const response = NextResponse.next()
    // Quick check: if no token, clear auth_active. If token exists, set it
    // (skip full JWT verify on public routes for performance).
    setAuthActiveCookie(response, !!token)
    return response
  }

  // Check if route requires authentication
  if (matchesRoute(pathname, PROTECTED_ROUTES)) {
    console.log(`[Middleware] Protected route: ${pathname}, has token: ${!!token}`)

    // No token - redirect to login
    if (!token) {
      console.log(`[Middleware] No token, redirecting to login`)
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      // Prevent Next.js router from caching this redirect — stale cached redirects
      // cause an infinite loop after login when the user navigates to this route.
      response.headers.set('Cache-Control', 'no-store')
      setAuthActiveCookie(response, false)
      return response
    }

    // Verify token
    const isValid = await verifyToken(token)
    console.log(`[Middleware] Token valid: ${isValid}`)

    if (!isValid) {
      // Invalid token - clear cookie and redirect to login
      console.log(`[Middleware] Invalid token, clearing and redirecting`)
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.headers.set('Cache-Control', 'no-store')
      response.cookies.delete('auth_token')
      setAuthActiveCookie(response, false)
      return response
    }
  }

  const response = NextResponse.next()
  setAuthActiveCookie(response, !!token)
  return response
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|static/).*)',
  ],
}
