/**
 * Referral Stats API
 * Get referral statistics for current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requireAuth } from '@/lib/auth-middleware'

/**
 * GET /api/user/referral/stats
 * Get user's referral statistics and referred users
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
        referrals: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            createdAt: true,
            profileCompleted: true,
            totalCAVEarned: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit to recent 50 referrals
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get PXP config for referral rewards
    const referralConfigs = await prisma.pXPConfig.findMany({
      where: { category: 'referral' },
    })

    const config = referralConfigs.reduce(
      (acc, item) => {
        if (item.key === 'referral_profile_created') acc.profileCreated = item.value
        if (item.key === 'referral_first_event') acc.firstEvent = item.value
        if (item.key === 'referral_max_per_user') acc.maxPerUser = item.value
        return acc
      },
      { profileCreated: 50, firstEvent: 100, maxPerUser: 250 }
    )

    return NextResponse.json({
      success: true,
      stats: {
        referralCode: user.referralCode,
        totalReferrals: user.referralCount,
        totalPXPEarned: user.referralPXPEarned,
        shareUrl: user.referralCode
          ? `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${user.referralCode}`
          : null,
      },
      referrals: user.referrals,
      config,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json({ error: 'Failed to fetch referral statistics' }, { status: 500 })
  }
}
