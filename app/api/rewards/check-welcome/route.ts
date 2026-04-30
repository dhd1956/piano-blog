import { NextRequest, NextResponse } from 'next/server'
import { checkWelcomeRewardEligibility } from '@/utils/rewards-contract'
import { getDb } from '@/lib/get-db'
import { REWARD_AMOUNTS } from '@/utils/rewards-contract'

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

    const db = await getDb()

    // Check database first
    const [user, welcomeConfig] = await Promise.all([
      db.user.findUnique({
        where: { walletAddress: address.toLowerCase() },
        select: { hasClaimedNewUserReward: true },
      }),
      db.pXPConfig.findUnique({
        where: { key: 'wallet_connection' },
        select: { value: true, enabled: true },
      }),
    ])

    const rewardAmount =
      welcomeConfig && welcomeConfig.enabled ? welcomeConfig.value : REWARD_AMOUNTS.NEW_USER

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

    return NextResponse.json({ ...eligibility, amount: rewardAmount })
  } catch (error: any) {
    console.error('Error checking welcome reward:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check reward eligibility' },
      { status: 500 }
    )
  }
}
