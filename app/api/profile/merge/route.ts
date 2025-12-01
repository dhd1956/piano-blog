import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/database'

/**
 * Account Merge API
 *
 * POST /api/profile/merge
 * Merges two user accounts when a user upgrades from OAuth (embedded wallet)
 * to an external wallet (MetaMask) with matching email.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { oldUserId, newWalletAddress, requesterAddress } = body

    // Validation
    if (!oldUserId || !newWalletAddress || !requesterAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: oldUserId, newWalletAddress, requesterAddress' },
        { status: 400 }
      )
    }

    // Security: Requester must be the new wallet address
    if (requesterAddress.toLowerCase() !== newWalletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only merge accounts to your own wallet' },
        { status: 403 }
      )
    }

    // Perform merge
    const mergedUser = await UserService.mergeUserAccounts(oldUserId, newWalletAddress)

    return NextResponse.json({
      success: true,
      user: mergedUser,
      message: 'Accounts successfully merged',
    })
  } catch (error) {
    console.error('Error merging accounts:', error)
    return NextResponse.json(
      {
        error: 'Failed to merge accounts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Check for Potential Merge
 *
 * GET /api/profile/merge?email=user@example.com&walletAddress=0x123...
 * Checks if there's an existing account with the same email
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const walletAddress = searchParams.get('walletAddress')

    if (!email || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: email, walletAddress' },
        { status: 400 }
      )
    }

    const potentialMerge = await UserService.findPotentialMerge(email, walletAddress)

    return NextResponse.json({
      hasPotentialMerge: !!potentialMerge,
      existingAccount: potentialMerge,
    })
  } catch (error) {
    console.error('Error checking for potential merge:', error)
    return NextResponse.json({ error: 'Failed to check for merge' }, { status: 500 })
  }
}
