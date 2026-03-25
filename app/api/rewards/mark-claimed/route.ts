import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'

/**
 * API Route: Mark welcome reward as claimed in database
 * POST /api/rewards/mark-claimed
 *
 * Body: { address: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    const db = await getDb()

    // Update user record
    await db.user.update({
      where: { walletAddress: address.toLowerCase() },
      data: {
        hasClaimedNewUserReward: true,
        totalPXPEarned: {
          increment: 25, // REWARD_AMOUNTS.NEW_USER
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error marking reward as claimed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark reward as claimed' },
      { status: 500 }
    )
  }
}
