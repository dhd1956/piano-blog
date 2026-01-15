/**
 * Reset Password API Route
 * Validates reset token and updates user password
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { hashPassword, generateToken } from '@/lib/auth'
import { sendSecurityAlertEmail } from '@/lib/email'
import { z } from 'zod'

// Validation schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = resetPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: validation.error.issues[0].message,
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { token, password, confirmPassword } = validation.data
    const db = await getDb()

    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Passwords do not match',
          message: 'Password and confirmation password must match',
        },
        { status: 400 }
      )
    }

    // Find user by reset token
    const user = await db.user.findUnique({
      where: { passwordResetToken: token },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        passwordResetExpiry: true,
        isActive: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token',
          message: 'Invalid or expired password reset token',
        },
        { status: 400 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account inactive',
          message: 'This account is inactive. Please contact support.',
        },
        { status: 403 }
      )
    }

    // Check if token has expired
    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      // Clear expired token
      await db.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Token expired',
          message: 'Password reset token has expired. Please request a new one.',
        },
        { status: 400 }
      )
    }

    // Hash the new password
    const passwordHash = await hashPassword(password)

    // Update user password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        updatedAt: new Date(),
      },
    })

    // Invalidate all existing sessions for security
    await db.session.deleteMany({
      where: { userId: user.id },
    })

    console.log(`✅ Password reset successful for user: ${user.username || user.id}`)

    // Send security alert email
    if (user.email) {
      await sendSecurityAlertEmail(
        user.email,
        user.username || user.displayName || 'User',
        'password_changed'
      )
    }

    // Generate new auth token for immediate login
    const authToken = await generateToken({
      id: user.id,
      username: user.username,
      walletAddress: null,
      role: 'SCOUT' as any, // Default role, will be fetched from DB
      email: user.email,
      displayName: user.displayName,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Password has been reset successfully. You are now logged in.',
        token: authToken,
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `auth_token=${authToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
        },
      }
    )
  } catch (error: any) {
    console.error('Reset password error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while resetting your password. Please try again later.',
      },
      { status: 500 }
    )
  }
}
