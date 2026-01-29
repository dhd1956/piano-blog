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

  // Skip middleware for public routes
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  if (matchesRoute(pathname, PROTECTED_ROUTES)) {
    const token = request.cookies.get('auth_token')?.value

    // No token - redirect to login
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verify token
    const isValid = await verifyToken(token)
    if (!isValid) {
      // Invalid token - clear cookie and redirect to login
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('auth_token')
      return response
    }
  }

  return NextResponse.next()
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
