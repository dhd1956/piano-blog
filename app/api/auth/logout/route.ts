/**
 * Logout API Route
 * Invalidates user session
 */

import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  // Always clear the cookie, even if something fails
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  })

  response.cookies.set('auth_token', '', {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 0,
  })

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
  } catch (error: any) {
    console.error('Logout error:', error)
  }

  return response
}
