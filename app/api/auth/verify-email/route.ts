/**
 * Email Verification API
 *
 * GET /api/auth/verify-email?token=xxx - Verify email with token
 * POST /api/auth/verify-email - Resend verification email
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken, createEmailVerificationToken } from '@/lib/auth'
import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/email'
import { getDb } from '@/lib/get-db'

// Rate limiting store (in-memory for development, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(
  email: string,
  maxRequests: number = 3,
  windowMs: number = 3600000
): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(email)

  if (!record || now > record.resetAt) {
    // Reset or create new record
    rateLimitStore.set(email, {
      count: 1,
      resetAt: now + windowMs,
    })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

/**
 * GET /api/auth/verify-email?token=xxx
 * Verify email address with token from email link
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    // Verify the token
    const result = await verifyEmailToken(token)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    // Send welcome email
    if (result.user?.email && result.user?.username) {
      await sendWelcomeEmail(result.user.email, result.user.username)
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/verify-email
 * Resend verification email
 *
 * Body: { email: string } or { userId: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, userId } = body

    if (!email && !userId) {
      return NextResponse.json({ error: 'Email or userId is required' }, { status: 400 })
    }

    const db = await getDb()

    // Find user
    let user
    if (userId) {
      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          emailVerified: true,
        },
      })
    } else {
      user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          emailVerified: true,
        },
      })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 })
    }

    // Check rate limit
    if (!checkRateLimit(user.email)) {
      return NextResponse.json(
        { error: 'Too many verification emails sent. Please try again later.' },
        { status: 429 }
      )
    }

    // Generate new verification token
    const token = await createEmailVerificationToken(user.id)

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, token, user.username || undefined)

    if (!emailResult.success) {
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred while sending verification email' },
      { status: 500 }
    )
  }
}
