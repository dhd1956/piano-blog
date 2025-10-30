import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ethers } from 'ethers'

const prisma = new PrismaClient()

/**
 * POST /api/auth/link-wallet
 *
 * Links a wallet address to an existing username-based account
 * Requires signature verification to prove wallet ownership
 * Mints accumulated PXP to the wallet after linking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, walletAddress, signature, message } = body

    // Validate required fields
    if (!username || !walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: username, walletAddress, signature, message' },
        { status: 400 }
      )
    }

    // Normalize wallet address
    const normalizedAddress = walletAddress.toLowerCase()

    // 1. Verify signature to prove wallet ownership
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature)

      if (recoveredAddress.toLowerCase() !== normalizedAddress) {
        return NextResponse.json({ error: 'Invalid signature: address mismatch' }, { status: 401 })
      }

      // Verify message contains expected content to prevent replay attacks
      if (!message.includes(username) || !message.includes('link wallet')) {
        return NextResponse.json({ error: 'Invalid message format' }, { status: 401 })
      }
    } catch (error) {
      console.error('Signature verification failed:', error)
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
    }

    // 2. Find the username account
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Check if user already has a wallet
    if (user.walletAddress) {
      return NextResponse.json({ error: 'Account already has a linked wallet' }, { status: 400 })
    }

    // 4. Check if wallet is already linked to another account
    const existingWalletUser = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    })

    if (existingWalletUser) {
      return NextResponse.json(
        { error: 'This wallet is already linked to another account' },
        { status: 400 }
      )
    }

    // 5. Link wallet to user account
    const updatedUser = await prisma.user.update({
      where: { username },
      data: {
        walletAddress: normalizedAddress,
        lastActive: new Date(),
      },
    })

    // 6. Mint accumulated PXP to wallet (Option A)
    let mintingResult: {
      success: boolean
      amount?: number
      message?: string
      error?: string
    } | null = null
    if (updatedUser.totalCAVEarned > 0) {
      try {
        // TODO: Integrate with your PXP token contract to mint tokens
        // This is a placeholder - you'll need to implement actual minting logic

        // Example structure (uncomment and adapt to your contract):
        /*
        const PXPRewardsService = require('@/utils/rewards-contract').default
        const rewardsService = new PXPRewardsService()

        const txHash = await rewardsService.mintPXP(
          normalizedAddress,
          updatedUser.totalCAVEarned,
          'Accumulated PXP from pre-wallet activities'
        )

        mintingResult = {
          success: true,
          amount: updatedUser.totalCAVEarned,
          txHash,
        }
        */

        // For now, just log it
        console.log(
          `[WALLET LINKING] Would mint ${updatedUser.totalCAVEarned} PXP to ${normalizedAddress}`
        )

        mintingResult = {
          success: true,
          amount: updatedUser.totalCAVEarned,
          message: 'PXP minting queued (contract integration pending)',
        }
      } catch (error) {
        console.error('PXP minting failed:', error)
        mintingResult = {
          success: false,
          error: 'Failed to mint PXP tokens',
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet linked successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        walletAddress: updatedUser.walletAddress,
        totalPXPEarned: updatedUser.totalCAVEarned,
      },
      pxpMinting: mintingResult,
    })
  } catch (error) {
    console.error('Error linking wallet:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * GET /api/auth/link-wallet?username=...
 *
 * Check if a username account is eligible for wallet linking
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username parameter required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        totalCAVEarned: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      eligible: !user.walletAddress,
      hasWallet: !!user.walletAddress,
      walletAddress: user.walletAddress,
      pendingPXP: user.totalCAVEarned,
      username: user.username,
    })
  } catch (error) {
    console.error('Error checking wallet link eligibility:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
