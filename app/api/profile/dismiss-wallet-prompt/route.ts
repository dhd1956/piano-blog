import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'

/**
 * POST /api/profile/dismiss-wallet-prompt
 *
 * Records that the user dismissed the wallet linking prompt.
 * The prompt will not show again for 30 days.
 *
 * Authorization: Authenticated user only
 *
 * Response:
 * {
 *   success: true,
 *   dismissedUntil: "2025-01-27T12:00:00.000Z" // 30 days from now
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        walletAddress: true,
        walletLinkingPromptShownCount: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't allow dismissal if user already has a wallet
    // (though this shouldn't happen as the prompt shouldn't show)
    if (user.walletAddress) {
      return NextResponse.json({ error: 'User already has a wallet linked' }, { status: 400 })
    }

    // Update user to record dismissal
    const now = new Date()
    const dismissedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

    await db.user.update({
      where: { id: user.id },
      data: {
        walletLinkingPromptDismissedAt: now,
        walletLinkingPromptShownCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        dismissedUntil: dismissedUntil.toISOString(),
        message: 'Wallet linking prompt dismissed for 30 days',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error dismissing wallet prompt:', error)
    return NextResponse.json({ error: 'Failed to dismiss wallet linking prompt' }, { status: 500 })
  }
}

/**
 * GET /api/profile/dismiss-wallet-prompt
 *
 * Checks if the wallet linking prompt should be shown for the current user.
 *
 * Authorization: Authenticated user only
 *
 * Response:
 * {
 *   shouldShow: boolean,
 *   reason?: string, // Why it should or shouldn't show
 *   dismissedAt?: string, // When it was last dismissed
 *   showCount?: number // How many times it's been shown
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        walletAddress: true,
        totalCAVEarned: true,
        walletLinkingPromptDismissedAt: true,
        walletLinkingPromptShownCount: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't show if user already has a wallet
    if (user.walletAddress) {
      return NextResponse.json({
        shouldShow: false,
        reason: 'User already has a wallet linked',
      })
    }

    // Don't show if user hasn't earned any PXP yet
    if (user.totalCAVEarned <= 0) {
      return NextResponse.json({
        shouldShow: false,
        reason: 'User has not earned any PXP yet',
      })
    }

    // Check if dismissed recently (within 30 days)
    if (user.walletLinkingPromptDismissedAt) {
      const daysSinceDismissal =
        (Date.now() - user.walletLinkingPromptDismissedAt.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceDismissal < 30) {
        return NextResponse.json({
          shouldShow: false,
          reason: 'User dismissed prompt recently',
          dismissedAt: user.walletLinkingPromptDismissedAt.toISOString(),
          daysRemaining: Math.ceil(30 - daysSinceDismissal),
          showCount: user.walletLinkingPromptShownCount,
        })
      }
    }

    // Prompt should be shown
    return NextResponse.json({
      shouldShow: true,
      reason: 'User has PXP and no wallet linked',
      pxpBalance: user.totalCAVEarned,
      showCount: user.walletLinkingPromptShownCount,
      dismissedAt: user.walletLinkingPromptDismissedAt?.toISOString(),
    })
  } catch (error) {
    console.error('Error checking wallet prompt status:', error)
    return NextResponse.json(
      { error: 'Failed to check wallet linking prompt status' },
      { status: 500 }
    )
  }
}
