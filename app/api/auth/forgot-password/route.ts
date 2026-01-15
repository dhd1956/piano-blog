/**
 * Forgot Password API Route
 * Generates password reset token and sends reset email
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { generateVerificationToken } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { z } from 'zod'

// Validation schema
const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = forgotPasswordSchema.safeParse(body)
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

    const { identifier } = validation.data
    const db = await getDb()

    // Find user by email or username
    const user = await db.user.findFirst({
      where: {
        OR: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        displayName: true,
      },
    })

    // Security: Always return success to prevent user enumeration
    // Even if user doesn't exist, we return success but don't send email
    if (!user) {
      console.log(`Password reset requested for non-existent user: ${identifier}`)
      return NextResponse.json(
        {
          success: true,
          message:
            'If an account exists with that email or username, a password reset link has been sent.',
        },
        { status: 200 }
      )
    }

    // Check if user has an email address
    if (!user.email) {
      console.log(`Password reset requested for user without email: ${user.username || user.id}`)
      return NextResponse.json(
        {
          success: false,
          error: 'No email address',
          message:
            'This account does not have an email address associated with it. Please contact support for assistance.',
        },
        { status: 400 }
      )
    }

    // Check if user has a password set (OAuth/wallet-only users)
    if (!user.passwordHash) {
      console.log(`Password reset requested for user without password: ${user.username || user.id}`)
      return NextResponse.json(
        {
          success: false,
          error: 'No password set',
          message:
            'This account was created using social login or wallet authentication and does not have a password. Please log in using your original method.',
          requiresCredentials: true,
        },
        { status: 400 }
      )
    }

    // Generate password reset token
    const token = generateVerificationToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiration

    // Store token in database
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiry: expiresAt,
      },
    })

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(
      user.email,
      token,
      user.username || user.displayName || 'User'
    )

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
      return NextResponse.json(
        {
          success: false,
          error: 'Email delivery failed',
          message: 'Failed to send password reset email. Please try again later.',
        },
        { status: 500 }
      )
    }

    console.log(`✅ Password reset email sent to: ${user.email}`)

    return NextResponse.json(
      {
        success: true,
        message:
          'If an account exists with that email or username, a password reset link has been sent.',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Forgot password error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while processing your request. Please try again later.',
      },
      { status: 500 }
    )
  }
}
