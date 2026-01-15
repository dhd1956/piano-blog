import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sendMagicLinkEmail } from '@/lib/email'
import { getDb } from '@/lib/get-db'

/**
 * POST /api/auth/magic-link/request
 * Request a magic link for passwordless login
 * Sends an email with a unique login link
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 })
    }

    const db = await getDb()

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        emailVerified: true,
      },
    })

    // For security, always return success even if email doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      console.log(`Magic link requested for non-existent email: ${normalizedEmail}`)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a magic link has been sent.',
      })
    }

    // Generate a secure random token (32 bytes = 64 hex characters)
    const token = crypto.randomBytes(32).toString('hex')

    // Set expiration to 15 minutes from now
    const expiry = new Date()
    expiry.setMinutes(expiry.getMinutes() + 15)

    // Store token in database
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpiry: expiry,
      },
    })

    // Send magic link email
    const emailResult = await sendMagicLinkEmail(
      normalizedEmail,
      token,
      user.displayName || user.username || undefined
    )

    if (!emailResult.success) {
      console.error('Failed to send magic link email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later.' },
        { status: 500 }
      )
    }

    console.log(`✉️ Magic link sent to: ${normalizedEmail}`)

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a magic link has been sent.',
    })
  } catch (error) {
    console.error('Error requesting magic link:', error)
    return NextResponse.json(
      { error: 'Internal server error while requesting magic link' },
      { status: 500 }
    )
  }
}
