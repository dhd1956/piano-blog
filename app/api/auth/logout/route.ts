/**
 * Logout API Route
 * Invalidates user session
 */

import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    const token =
      request.cookies.get('auth_token')?.value || request.headers.get('authorization')?.substring(7)

    if (token) {
      // Delete session from database
      try {
        await deleteSession(token)
      } catch (error) {
        // Session might not exist in DB, which is fine
        console.log('Session deletion skipped:', error)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': 'auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
        },
      }
    )
  } catch (error: any) {
    console.error('Logout error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed',
        message: error.message || 'An error occurred during logout',
      },
      { status: 500 }
    )
  }
}
