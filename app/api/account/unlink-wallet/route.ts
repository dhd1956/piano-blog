/**
 * Unlink Wallet API
 *
 * POST /api/account/unlink-wallet - Remove wallet address from user account
 * Requires user to have username/password auth before unlinking
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { sendSecurityAlertEmail } from '@/lib/email'
import { z } from 'zod'

const unlinkWalletSchema = z.object({
  userId: z.number(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = unlinkWalletSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { userId, walletAddress } = validation.data
    const normalizedAddress = walletAddress.toLowerCase()
    const db = await getDb()

    // Find user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        email: true,
        passwordHash: true,
        displayName: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify wallet address matches
    if (user.walletAddress !== normalizedAddress) {
      return NextResponse.json({ error: 'Wallet address does not match' }, { status: 400 })
    }

    // Ensure user has alternative authentication method (username/password)
    if (!user.username || !user.passwordHash) {
      return NextResponse.json(
        {
          error:
            'Cannot unlink wallet without username/password authentication. Please set up a password first.',
          requiresPassword: true,
        },
        { status: 400 }
      )
    }

    // Ensure user has verified email for account recovery
    if (!user.email) {
      return NextResponse.json(
        {
          error: 'Cannot unlink wallet without a verified email for account recovery.',
          requiresEmail: true,
        },
        { status: 400 }
      )
    }

    // Remove wallet address
    await db.user.update({
      where: { id: user.id },
      data: {
        walletAddress: null,
      },
    })

    // Send security alert email
    if (user.email) {
      await sendSecurityAlertEmail(user.email, user.username || 'User', 'wallet_unlinked')
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet unlinked successfully.',
    })
  } catch (error) {
    console.error('Unlink wallet error:', error)
    return NextResponse.json({ error: 'An error occurred while unlinking wallet' }, { status: 500 })
  }
}
