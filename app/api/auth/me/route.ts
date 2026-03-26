/**
 * Current User API Route
 * Returns the currently authenticated user's information
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request as any)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Not authenticated',
        },
        { status: 401 }
      )
    }

    // Fetch full user data including wallet type fields
    const db = await getDb()
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        role: true,
        email: true,
        displayName: true,
        emailVerified: true,
        walletType: true,
        authProvider: true,
        totalPXPEarned: true,
      },
    })

    if (!fullUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          message: 'User no longer exists',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: fullUser.id,
        username: fullUser.username,
        walletAddress: fullUser.walletAddress,
        role: fullUser.role,
        email: fullUser.email,
        displayName: fullUser.displayName,
        emailVerified: fullUser.emailVerified,
        walletType: fullUser.walletType,
        authProvider: fullUser.authProvider,
        totalPXPEarned: fullUser.totalPXPEarned,
      },
    })
  } catch (error: any) {
    console.error('Get current user error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user',
        message: error.message || 'An error occurred',
      },
      { status: 500 }
    )
  }
}
