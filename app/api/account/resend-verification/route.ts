/**
 * Resend Email Verification API
 *
 * POST /api/account/resend-verification - Resend verification email to user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { createEmailVerificationToken } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import { z } from 'zod'

const resendSchema = z.object({
  userId: z.number(),
})

// Rate limiting: 3 emails per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_EMAILS_PER_WINDOW = 3

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = resendSchema.safeParse(body)

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
        email: true,
        username: true,
        emailVerified: true,
        emailVerificationToken: true,
        emailVerificationExpiry: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'No email address associated with this account' },
        { status: 400 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 })
    }

    // Rate limiting check
    // Check if there's a recent verification token that hasn't expired
    if (user.emailVerificationExpiry) {
      const timeSinceLastEmail =
        Date.now() - (user.emailVerificationExpiry.getTime() - 24 * 60 * 60 * 1000)
      if (timeSinceLastEmail < RATE_LIMIT_WINDOW_MS / MAX_EMAILS_PER_WINDOW) {
        const waitMinutes = Math.ceil(
          (RATE_LIMIT_WINDOW_MS / MAX_EMAILS_PER_WINDOW - timeSinceLastEmail) / 1000 / 60
        )
        return NextResponse.json(
          {
            error: `Please wait ${waitMinutes} minutes before requesting another verification email`,
            rateLimited: true,
          },
          { status: 429 }
        )
      }
    }

    // Generate new verification token
    const verificationToken = await createEmailVerificationToken(user.id)

    // Send verification email
    const emailResult = await sendVerificationEmail(
      user.email,
      verificationToken,
      user.username || undefined
    )

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      return NextResponse.json(
        {
          error: 'Failed to send verification email. Please try again later.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred while resending verification email' },
      { status: 500 }
    )
  }
}
