/**
 * Link Embedded Wallet API Route
 * Updates an already-authenticated user's wallet address with a Reown embedded wallet.
 * Called after OAuthEmailCapture detects a wallet_linking_intent flag.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateToken, AuthUser } from '@/lib/auth'
import { authenticate } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'
import { z } from 'zod'

const linkWalletSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  email: z.string().email().optional(),
  authProvider: z.enum(['google', 'email', 'apple', 'facebook', 'discord', 'x']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Require an authenticated session
    const sessionUser = await authenticate(request)
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = linkWalletSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { walletAddress, email, authProvider } = validation.data
    const normalizedAddress = walletAddress.toLowerCase()
    const db = await getDb()

    // Check if this wallet address is already used by a DIFFERENT user
    const existingWalletUser = await db.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: { id: true },
    })

    if (existingWalletUser && existingWalletUser.id !== sessionUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet conflict',
          message: 'This wallet address is already linked to another account.',
        },
        { status: 409 }
      )
    }

    // If wallet is already on THIS user, return success (no-op)
    if (existingWalletUser && existingWalletUser.id === sessionUser.id) {
      console.log(
        `[link-embedded-wallet] Wallet ${normalizedAddress} already belongs to user ${sessionUser.id}, no-op`
      )
      return NextResponse.json({
        success: true,
        message: 'Wallet already linked to this account',
      })
    }

    // Build update data
    const updates: Record<string, any> = {
      walletAddress: normalizedAddress,
      walletType: 'embedded',
      embeddedWalletCreatedAt: new Date(),
      lastActive: new Date(),
    }

    if (authProvider) {
      updates.authProvider = authProvider
    }

    // Update email if user has none and we have one from OAuth
    if (email) {
      const currentUser = await db.user.findUnique({
        where: { id: sessionUser.id },
        select: { email: true },
      })

      if (!currentUser?.email) {
        // Check if email is already in use by another account
        const existingEmailUser = await db.user.findUnique({
          where: { email },
          select: { id: true },
        })
        if (!existingEmailUser) {
          updates.email = email
          updates.emailVerified = true
          updates.emailVerifiedAt = new Date()
        }
      }
    }

    // Update the user record
    const updatedUser = await db.user.update({
      where: { id: sessionUser.id },
      data: updates,
      select: {
        id: true,
        username: true,
        walletAddress: true,
        role: true,
        email: true,
        displayName: true,
        walletType: true,
        authProvider: true,
      },
    })

    // Regenerate JWT token with new wallet address
    const authUser: AuthUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      walletAddress: updatedUser.walletAddress,
      role: updatedUser.role,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
    }

    const token = await generateToken(authUser)

    console.log(
      `[link-embedded-wallet] Linked embedded wallet ${normalizedAddress} to user ${sessionUser.id} (provider: ${authProvider || 'unknown'})`
    )

    return NextResponse.json(
      {
        success: true,
        message: 'Embedded wallet linked successfully',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          walletAddress: updatedUser.walletAddress,
          role: updatedUser.role,
          displayName: updatedUser.displayName,
          email: updatedUser.email,
          walletType: updatedUser.walletType,
          authProvider: updatedUser.authProvider,
        },
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
        },
      }
    )
  } catch (error: any) {
    console.error('[link-embedded-wallet] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Linking failed',
        message: error.message || 'An error occurred while linking the wallet',
      },
      { status: 500 }
    )
  }
}
