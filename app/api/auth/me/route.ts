/**
 * Current User API Route
 * Returns the currently authenticated user's information
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth-middleware'

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

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        walletAddress: user.walletAddress,
        role: user.role,
        email: user.email,
        displayName: user.displayName,
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
