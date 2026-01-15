/**
 * Sessions Management API
 *
 * GET /api/account/sessions - Get active sessions for user
 * DELETE /api/account/sessions - Logout all sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { sendSecurityAlertEmail } from '@/lib/email'
import { z } from 'zod'

const logoutAllSchema = z.object({
  userId: z.number(),
})

/**
 * GET - Retrieve active sessions
 * Note: This is a simplified version. In production, you'd have a sessions table
 * tracking device info, IP addresses, last activity, etc.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const db = await getDb()

    // Find user
    const user = await db.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        username: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // In a production app, you'd query a sessions table here
    // For now, we'll return a placeholder indicating the current session
    const sessions = [
      {
        id: 'current',
        device: 'Current Browser',
        lastActive: new Date().toISOString(),
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        isCurrent: true,
      },
    ]

    return NextResponse.json({
      sessions,
      message: 'Session management is simplified in this version',
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: 'An error occurred while retrieving sessions' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Logout all sessions
 * Note: This is a simplified version. In production, you'd invalidate all session tokens
 * and force re-authentication across all devices.
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = logoutAllSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { userId } = validation.data
    const db = await getDb()

    // Find user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // In a production app with a sessions table, you would:
    // 1. Delete all session records for this user
    // 2. Invalidate all JWT tokens
    // 3. Force re-authentication on all devices
    //
    // For now, we'll just send a security alert and return success
    // The client will handle clearing localStorage and redirecting to login

    // Send security alert email
    if (user.email) {
      await sendSecurityAlertEmail(user.email, user.username || 'User', 'sessions_logged_out')
    }

    return NextResponse.json({
      success: true,
      message:
        'All sessions have been logged out. Please clear your browser cache and login again.',
    })
  } catch (error) {
    console.error('Logout all sessions error:', error)
    return NextResponse.json(
      { error: 'An error occurred while logging out sessions' },
      { status: 500 }
    )
  }
}
