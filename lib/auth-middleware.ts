/**
 * Authentication & Authorization Middleware
 * Handles role-based access control for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, getUserByWallet, getUserById, AuthUser } from './auth'
import { UserRole } from '@prisma/client'

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser
}

/**
 * Extract token from Authorization header or cookies
 */
function extractToken(request: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check cookies
  const token = request.cookies.get('auth_token')?.value
  if (token) {
    return token
  }

  return null
}

/**
 * Middleware to authenticate user (JWT or wallet)
 * Sets request.user if authenticated
 */
export async function authenticate(request: AuthenticatedRequest): Promise<AuthUser | null> {
  // Try JWT authentication first
  const token = extractToken(request)
  if (token) {
    const payload = await verifyToken(token)
    if (payload && payload.userId) {
      return {
        id: payload.userId,
        username: payload.username,
        walletAddress: payload.walletAddress,
        role: payload.role,
        email: null,
        displayName: null,
      }
    }
  }

  // Try wallet authentication (from query params or body)
  const url = new URL(request.url)
  const walletAddress = url.searchParams.get('wallet') || url.searchParams.get('address')

  if (walletAddress) {
    const user = await getUserByWallet(walletAddress)
    if (user) {
      return user
    }
  }

  return null
}

/**
 * Require authentication middleware
 * Returns 401 if not authenticated
 */
export async function requireAuth(
  request: AuthenticatedRequest
): Promise<{ user: AuthUser } | NextResponse> {
  const user = await authenticate(request)

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required. Please login or connect your wallet.',
      },
      { status: 401 }
    )
  }

  return { user }
}

/**
 * Require specific role(s) middleware
 * Returns 403 if user doesn't have required role
 */
export async function requireRole(
  request: AuthenticatedRequest,
  allowedRoles: UserRole[]
): Promise<{ user: AuthUser } | NextResponse> {
  const authResult = await requireAuth(request)

  // If not authenticated, return 401
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        userRole: user.role,
      },
      { status: 403 }
    )
  }

  return { user }
}

/**
 * Check if user is blog owner
 */
export function isBlogOwner(user: AuthUser): boolean {
  const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()

  // Check by role
  if (user.role === UserRole.BLOG_OWNER) {
    return true
  }

  // Check by wallet address
  if (user.walletAddress && blogOwnerAddress) {
    return user.walletAddress.toLowerCase() === blogOwnerAddress
  }

  return false
}

/**
 * Permission checker utilities
 */
export const can = {
  /**
   * Can create venues (SCOUT, BLOG_OWNER, or anonymous)
   */
  createVenue(user: AuthUser | null): boolean {
    // Anonymous users can create venues
    if (!user) return true
    const allowedRoles: UserRole[] = [UserRole.SCOUT, UserRole.BLOG_OWNER]
    return allowedRoles.includes(user.role)
  },

  /**
   * Can read all venues (everyone)
   */
  readVenues(user: AuthUser | null): boolean {
    return true // Everyone can read venues
  },

  /**
   * Can update venue details (CURATOR, BLOG_OWNER)
   */
  updateVenue(user: AuthUser | null): boolean {
    if (!user) return false
    const allowedRoles: UserRole[] = [UserRole.CURATOR, UserRole.BLOG_OWNER]
    return allowedRoles.includes(user.role)
  },

  /**
   * Can delete venues (BLOG_OWNER only)
   */
  deleteVenue(user: AuthUser | null): boolean {
    if (!user) return false
    return user.role === UserRole.BLOG_OWNER
  },

  /**
   * Can validate venues (VALIDATOR, BLOG_OWNER)
   */
  validateVenue(user: AuthUser | null): boolean {
    if (!user) return false
    const allowedRoles: UserRole[] = [UserRole.VALIDATOR, UserRole.BLOG_OWNER]
    return allowedRoles.includes(user.role)
  },

  /**
   * Can instantly verify venues (BLOG_OWNER only)
   */
  instantVerifyVenue(user: AuthUser | null): boolean {
    if (!user) return false
    return user.role === UserRole.BLOG_OWNER || isBlogOwner(user)
  },

  /**
   * Can manage users (BLOG_OWNER only)
   */
  manageUsers(user: AuthUser | null): boolean {
    if (!user) return false
    return user.role === UserRole.BLOG_OWNER || isBlogOwner(user)
  },
}

/**
 * Helper to create error responses
 */
export function unauthorizedResponse(message?: string) {
  return NextResponse.json(
    {
      success: false,
      error: 'Unauthorized',
      message: message || 'Authentication required',
    },
    { status: 401 }
  )
}

export function forbiddenResponse(message?: string) {
  return NextResponse.json(
    {
      success: false,
      error: 'Forbidden',
      message: message || 'You do not have permission to perform this action',
    },
    { status: 403 }
  )
}

/**
 * Get current session user for server components
 * Extracts token from cookies and returns user if authenticated
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return null
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.userId) {
      return null
    }

    // Get full user data from database
    const user = await getUserById(payload.userId)
    return user
  } catch (error) {
    console.error('Error getting session user:', error)
    return null
  }
}
