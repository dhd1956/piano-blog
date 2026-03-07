/**
 * Embedded Login API Route
 * Creates session for users with Reown embedded wallets (Google/email OAuth)
 * Called after OAuthEmailCapture detects an embedded wallet connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateToken, AuthUser } from '@/lib/auth'
import { getDb } from '@/lib/get-db'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

// Validation schema
const embeddedLoginSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  email: z.string().email().optional(),
  authProvider: z.enum(['google', 'email', 'apple', 'facebook', 'discord', 'x']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = embeddedLoginSchema.safeParse(body)
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

    // Find or create user by wallet address
    let user = await db.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        role: true,
        email: true,
        displayName: true,
        isActive: true,
        walletType: true,
        authProvider: true,
        totalCAVEarned: true,
        firstPXPEarnedAt: true,
        hasClaimedNewUserReward: true,
      },
    })

    let showWelcomeReward = false
    const welcomePXP = 0

    // Check if email matches a more complete existing account
    // This handles two cases:
    // 1. No user found by wallet → email matches existing account (new embedded wallet)
    // 2. Ghost user found by wallet (no username/email) → email matches real account
    if (email) {
      const existingUserByEmail = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          username: true,
          walletAddress: true,
          role: true,
          email: true,
          displayName: true,
          isActive: true,
          walletType: true,
          authProvider: true,
          totalCAVEarned: true,
          firstPXPEarnedAt: true,
        },
      })

      if (existingUserByEmail && existingUserByEmail.id !== user?.id) {
        // Found a real account by email that's different from the wallet lookup result
        const ghostUser = user // The user found by wallet (may be a ghost, or null)

        console.log(
          `[embedded-login] Found existing user ${existingUserByEmail.id} (${existingUserByEmail.username}) by email ${email}, updating wallet to ${normalizedAddress}`
        )

        // Delete the ghost user if it exists and is incomplete (no username, no email)
        if (ghostUser && !ghostUser.username && !ghostUser.email) {
          console.log(
            `[embedded-login] Deleting ghost user ${ghostUser.id} (wallet: ${ghostUser.walletAddress})`
          )
          await db.user.delete({ where: { id: ghostUser.id } })
        }

        // Update the real user's wallet address to the new embedded wallet
        user = await db.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            walletAddress: normalizedAddress,
            walletType: 'embedded',
            authProvider: authProvider || existingUserByEmail.authProvider || 'email',
            embeddedWalletCreatedAt:
              existingUserByEmail.walletType === 'embedded' ? undefined : new Date(),
            lastActive: new Date(),
          },
          select: {
            id: true,
            username: true,
            walletAddress: true,
            role: true,
            email: true,
            displayName: true,
            isActive: true,
            walletType: true,
            authProvider: true,
            totalCAVEarned: true,
            firstPXPEarnedAt: true,
          },
        })
      } else if (!user && existingUserByEmail) {
        // No wallet match at all, just update the email-matched user's wallet
        user = await db.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            walletAddress: normalizedAddress,
            walletType: 'embedded',
            authProvider: authProvider || existingUserByEmail.authProvider || 'email',
            embeddedWalletCreatedAt:
              existingUserByEmail.walletType === 'embedded' ? undefined : new Date(),
            lastActive: new Date(),
          },
          select: {
            id: true,
            username: true,
            walletAddress: true,
            role: true,
            email: true,
            displayName: true,
            isActive: true,
            walletType: true,
            authProvider: true,
            totalCAVEarned: true,
            firstPXPEarnedAt: true,
          },
        })
      }
    }

    const isNewUser = !user

    if (!user) {
      // Truly new user — create account with embedded wallet
      user = await db.user.create({
        data: {
          walletAddress: normalizedAddress,
          email: email || null,
          emailVerified: email ? true : false, // OAuth emails are pre-verified
          emailVerifiedAt: email ? new Date() : null,
          role: UserRole.SCOUT,
          isActive: true,
          walletType: 'embedded',
          authProvider: authProvider || 'email',
          embeddedWalletCreatedAt: new Date(),
        },
        select: {
          id: true,
          username: true,
          walletAddress: true,
          role: true,
          email: true,
          displayName: true,
          isActive: true,
          walletType: true,
          authProvider: true,
          totalCAVEarned: true,
          firstPXPEarnedAt: true,
        },
      })

      // Welcome PXP is distributed on-chain via /api/rewards/claim-welcome
      showWelcomeReward = true
    } else if (!isNewUser) {
      // Existing user - update if needed
      const updates: Record<string, any> = {
        lastActive: new Date(),
      }

      // Update email if user has none and we have one from OAuth
      if (!user.email && email) {
        // Check if email is already in use by another account
        const existingUserWithEmail = await db.user.findUnique({
          where: { email },
          select: { id: true },
        })
        if (!existingUserWithEmail) {
          updates.email = email
          updates.emailVerified = true
          updates.emailVerifiedAt = new Date()
        } else {
          console.log(
            `[embedded-login] Email ${email} already in use by user ${existingUserWithEmail.id}, skipping email update`
          )
        }
      }

      // Update wallet type if not set (migrating existing users)
      if (!user.walletType) {
        updates.walletType = 'embedded'
        updates.embeddedWalletCreatedAt = new Date()
      }

      // Update auth provider if not set
      if (!user.authProvider && authProvider) {
        updates.authProvider = authProvider
      }

      await db.user.update({
        where: { id: user.id },
        data: updates,
      })

      // Show welcome reward banner if user hasn't claimed their on-chain PXP yet
      if (!user.hasClaimedNewUserReward) {
        showWelcomeReward = true
      }
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account disabled',
          message: 'This account has been disabled',
        },
        { status: 403 }
      )
    }

    // Generate JWT token
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      walletAddress: user.walletAddress,
      role: user.role,
      email: user.email,
      displayName: user.displayName,
    }

    const token = await generateToken(authUser)

    console.log(
      `[embedded-login] ${isNewUser ? 'Created' : 'Logged in'} embedded wallet user: ${normalizedAddress} (provider: ${authProvider || 'unknown'})`
    )

    const response = NextResponse.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        walletAddress: user.walletAddress,
        role: user.role,
        displayName: user.displayName,
        email: user.email,
        walletType: user.walletType || 'embedded',
        authProvider: user.authProvider || authProvider,
      },
      token,
      isNewUser,
      showWelcomeReward,
      welcomePXP,
    })

    response.cookies.set('auth_token', token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: any) {
    console.error('[embedded-login] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Login failed',
        message: error.message || 'An error occurred during login',
      },
      { status: 500 }
    )
  }
}
