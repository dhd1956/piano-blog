/**
 * Permissions Check API
 * Returns permission status for a connected wallet
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing parameter',
          message: 'Wallet address is required',
        },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()
    const db = await getDb()

    // Get user with role from database
    const user = await db.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: {
        id: true,
        role: true,
        username: true,
        walletAddress: true,
      },
    })

    // Default to SCOUT role for non-registered users
    if (!user) {
      return NextResponse.json({
        success: true,
        permissions: {
          role: UserRole.SCOUT,
          isBlogOwner: false,
          isCurator: false,
          isValidator: false,
          canAccessCurator: false,
          canAccessValidator: false,
          canAccessAdmin: false,
        },
      })
    }

    // Role-based permissions
    const permissions = {
      role: user.role,
      isBlogOwner: user.role === UserRole.BLOG_OWNER,
      isCurator: user.role === UserRole.CURATOR || user.role === UserRole.BLOG_OWNER,
      isValidator:
        user.role === UserRole.CURATOR ||
        user.role === UserRole.VALIDATOR ||
        user.role === UserRole.BLOG_OWNER,
      canAccessCurator: user.role === UserRole.CURATOR || user.role === UserRole.BLOG_OWNER,
      canAccessValidator:
        user.role === UserRole.CURATOR ||
        user.role === UserRole.VALIDATOR ||
        user.role === UserRole.BLOG_OWNER,
      canAccessAdmin: user.role === UserRole.BLOG_OWNER,
    }

    return NextResponse.json({
      success: true,
      permissions,
    })
  } catch (error: any) {
    console.error('Error checking permissions:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check permissions',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
