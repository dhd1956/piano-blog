import { NextRequest, NextResponse } from 'next/server'
import { checkWelcomeRewardEligibility } from '@/utils/rewards-contract'
import prisma from '@/lib/prisma'

/**
 * API Route: Check if user is eligible for welcome reward
 * GET /api/rewards/check-welcome?address=0x...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    // Check database first
    const user = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
      select: { hasClaimedNewUserReward: true },
    })

    if (user?.hasClaimedNewUserReward) {
      return NextResponse.json({
        eligible: false,
        amount: 0,
        message: 'Welcome reward already claimed',
        claimedInDb: true,
      })
    }

    // Check blockchain eligibility
    const eligibility = await checkWelcomeRewardEligibility(address)

    return NextResponse.json(eligibility)
  } catch (error: any) {
    console.error('Error checking welcome reward:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check reward eligibility' },
      { status: 500 }
    )
  }
}
