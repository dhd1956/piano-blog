import { NextRequest, NextResponse } from 'next/server'
import { generateToken, getUserById } from '@/lib/auth'
import { getDb } from '@/lib/get-db'

/**
 * GET /api/auth/magic-link/verify?token=xxx
 * Verify magic link token and log user in
 * Creates a session by setting JWT cookie
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    // Validate token parameter
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing verification token' }, { status: 400 })
    }

    const db = await getDb()

    // Find user by token
    const user = await db.user.findUnique({
      where: { emailVerificationToken: token },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        walletAddress: true,
        role: true,
        emailVerificationExpiry: true,
        emailVerified: true,
      },
    })

    // Check if token exists
    if (!user) {
      return NextResponse.json(
        {
          error: 'Invalid verification link',
          message: 'This magic link is invalid or has already been used.',
        },
        { status: 404 }
      )
    }

    // Check if token has expired
    if (!user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
      // Clear expired token
      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
      })

      return NextResponse.json(
        {
          error: 'Expired verification link',
          message: 'This magic link has expired. Please request a new one.',
        },
        { status: 410 }
      )
    }

    // Valid token - clear it and log user in
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        // If email wasn't verified yet, mark it as verified
        ...(user.emailVerified
          ? {}
          : {
              emailVerified: true,
              emailVerifiedAt: new Date(),
            }),
      },
    })

    // Get full user data and create JWT session token
    const fullUser = await getUserById(updatedUser.id)
    if (!fullUser) {
      return NextResponse.json({ error: 'User not found after update' }, { status: 500 })
    }

    const jwtToken = await generateToken(fullUser)

    // Create response with redirect
    const response = NextResponse.redirect(new URL('/dashboard', request.url))

    // Set HTTP-only cookie for session
    response.cookies.set('auth_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    console.log(`✅ Magic link login successful for: ${user.email || user.username}`)

    return response
  } catch (error) {
    console.error('Error verifying magic link:', error)
    return NextResponse.json(
      { error: 'Internal server error during verification' },
      { status: 500 }
    )
  }
}
