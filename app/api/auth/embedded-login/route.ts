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
      },
    })

    const isNewUser = !user
    let showWelcomeReward = false
    let welcomePXP = 0

    if (!user) {
      // Check if email is already in use by another account
      let emailToUse = email || null
      if (email) {
        const existingUserWithEmail = await db.user.findUnique({
          where: { email },
          select: { id: true },
        })
        if (existingUserWithEmail) {
          console.log(
            `[embedded-login] Email ${email} already in use by user ${existingUserWithEmail.id}, creating account without email`
          )
          emailToUse = null
        }
      }

      // Create new user with embedded wallet
      user = await db.user.create({
        data: {
          walletAddress: normalizedAddress,
          email: emailToUse,
          emailVerified: emailToUse ? true : false, // OAuth emails are pre-verified
          emailVerifiedAt: emailToUse ? new Date() : null,
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

      // Award welcome PXP to new users
      try {
        const welcomeConfig = await db.pXPConfig.findUnique({
          where: { key: 'wallet_connection' },
          select: { value: true, enabled: true },
        })

        welcomePXP = welcomeConfig && welcomeConfig.enabled ? welcomeConfig.value : 100

        await db.user.update({
          where: { id: user.id },
          data: {
            totalCAVEarned: { increment: welcomePXP },
            firstPXPEarnedAt: new Date(),
          },
        })

        showWelcomeReward = true
        console.log(
          `[embedded-login] Awarded ${welcomePXP} PXP welcome reward to new embedded wallet user ${normalizedAddress}`
        )
      } catch (pxpError) {
        console.error('[embedded-login] Error awarding welcome PXP:', pxpError)
      }
    } else {
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

      // Check if user should get welcome reward (existing wallet user who never earned PXP)
      if (user.totalCAVEarned === 0 && !user.firstPXPEarnedAt) {
        try {
          const welcomeConfig = await db.pXPConfig.findUnique({
            where: { key: 'wallet_connection' },
            select: { value: true, enabled: true },
          })

          welcomePXP = welcomeConfig && welcomeConfig.enabled ? welcomeConfig.value : 100

          await db.user.update({
            where: { id: user.id },
            data: {
              totalCAVEarned: { increment: welcomePXP },
              firstPXPEarnedAt: new Date(),
            },
          })

          showWelcomeReward = true
          console.log(
            `[embedded-login] Awarded ${welcomePXP} PXP welcome reward to existing user ${normalizedAddress}`
          )
        } catch (pxpError) {
          console.error('[embedded-login] Error awarding welcome PXP:', pxpError)
        }
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

    return NextResponse.json(
      {
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
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
        },
      }
    )
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
