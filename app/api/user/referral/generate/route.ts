/**
 * Generate Referral Code API
 * Creates a unique referral code for a user
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requireAuth } from '@/lib/auth-middleware'

// Generate a random referral code (e.g., "PIANIST123")
function generateReferralCode(): string {
  const prefix = 'PIANIST'
  const randomNum = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0')
  return `${prefix}${randomNum}`
}

/**
 * POST /api/user/referral/generate
 * Generate or retrieve user's referral code
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const userId = authResult.user.id

    // Check if user already has a referral code
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    })

    if (existingUser?.referralCode) {
      return NextResponse.json({
        success: true,
        referralCode: existingUser.referralCode,
        message: 'Referral code already exists',
      })
    }

    // Generate unique referral code
    let referralCode = generateReferralCode()
    let attempts = 0
    const maxAttempts = 10

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const existing = await prisma.user.findUnique({
        where: { referralCode },
      })

      if (!existing) break

      referralCode = generateReferralCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique referral code' },
        { status: 500 }
      )
    }

    // Update user with referral code
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { referralCode },
      select: { referralCode: true, displayName: true, username: true },
    })

    return NextResponse.json({
      success: true,
      referralCode: updatedUser.referralCode,
      message: 'Referral code generated successfully',
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${updatedUser.referralCode}`,
    })
  } catch (error) {
    console.error('Error generating referral code:', error)
    return NextResponse.json({ error: 'Failed to generate referral code' }, { status: 500 })
  }
}

/**
 * GET /api/user/referral/generate
 * Get user's existing referral code
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: {
        referralCode: true,
        referralCount: true,
        referralPXPEarned: true,
      },
    })

    if (!user?.referralCode) {
      return NextResponse.json({
        success: true,
        hasReferralCode: false,
        message: 'No referral code generated yet',
      })
    }

    return NextResponse.json({
      success: true,
      hasReferralCode: true,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      referralPXPEarned: user.referralPXPEarned,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${user.referralCode}`,
    })
  } catch (error) {
    console.error('Error fetching referral code:', error)
    return NextResponse.json({ error: 'Failed to fetch referral code' }, { status: 500 })
  }
}
