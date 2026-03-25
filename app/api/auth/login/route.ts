/**
 * Login API Route
 * Authenticates users with username/password or wallet address
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateUser,
  generateToken,
  getUserByWallet,
  upsertWalletUser,
  AuthUser,
} from '@/lib/auth'
import { getDb } from '@/lib/get-db'
import { z } from 'zod'

// 7-day grace period for email verification (in milliseconds)
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000

// Validation schemas
// Accept either email or username as the identifier
const credentialsLoginSchema = z.object({
  identifier: z
    .string()
    .min(3)
    .transform((val) => val.toLowerCase()), // Normalize to lowercase
  password: z.string().min(6),
})

// Legacy support: also accept 'username' field for backwards compatibility
const usernameLoginSchema = z.object({
  username: z
    .string()
    .min(3)
    .transform((val) => val.toLowerCase()),
  password: z.string().min(6),
})

const walletLoginSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if it's wallet-based auth
    if (body.walletAddress) {
      const validation = walletLoginSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            message: 'Invalid wallet address format',
            details: validation.error.issues,
          },
          { status: 400 }
        )
      }

      // For wallet-based auth, we just upsert the user (creates if doesn't exist)
      const user = await upsertWalletUser(validation.data.walletAddress)

      const db = await getDb()

      // Check if this is a new wallet user (never earned PXP before)
      const fullUser = await db.user.findUnique({
        where: { id: user.id },
        select: {
          totalPXPEarned: true,
          firstPXPEarnedAt: true,
        },
      })

      let showWelcomeReward = false
      let welcomePXP = 0

      if (fullUser && fullUser.totalPXPEarned === 0 && !fullUser.firstPXPEarnedAt) {
        // This is a brand new wallet user - award welcome reward
        try {
          // Get welcome reward amount from PXP config
          const welcomeConfig = await db.pXPConfig.findUnique({
            where: { key: 'wallet_connection' },
            select: { value: true, enabled: true },
          })

          welcomePXP = welcomeConfig && welcomeConfig.enabled ? welcomeConfig.value : 100

          // Award PXP
          await db.user.update({
            where: { id: user.id },
            data: {
              totalPXPEarned: { increment: welcomePXP },
              firstPXPEarnedAt: new Date(),
            },
          })

          showWelcomeReward = true
          console.log(
            `✅ Awarded ${welcomePXP} PXP welcome reward to new wallet user ${user.walletAddress}`
          )
        } catch (pxpError) {
          console.error('Error awarding welcome PXP:', pxpError)
          // Don't fail login if PXP awarding fails
        }
      }

      const token = await generateToken(user)

      return NextResponse.json(
        {
          success: true,
          message: 'Wallet authenticated successfully',
          user: {
            id: user.id,
            username: user.username,
            walletAddress: user.walletAddress,
            role: user.role,
            displayName: user.displayName,
          },
          token,
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
    }

    // Username/password authentication (accepts email or username)
    // Try new schema first, fall back to legacy username field
    let identifier: string
    let password: string

    const newValidation = credentialsLoginSchema.safeParse(body)
    if (newValidation.success) {
      identifier = newValidation.data.identifier
      password = newValidation.data.password
    } else {
      // Fall back to legacy 'username' field for backwards compatibility
      const legacyValidation = usernameLoginSchema.safeParse(body)
      if (!legacyValidation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            message: 'Invalid email/username or password format',
            details: legacyValidation.error.issues,
          },
          { status: 400 }
        )
      }
      identifier = legacyValidation.data.username
      password = legacyValidation.data.password
    }

    // Detect if identifier is an email or username
    const isEmail = identifier.includes('@')
    let user: AuthUser | null = null

    if (isEmail) {
      // Look up by email first, then authenticate
      const db = await getDb()
      const userByEmail = await db.user.findUnique({
        where: { email: identifier },
        select: { username: true },
      })
      if (userByEmail && userByEmail.username) {
        user = await authenticateUser(userByEmail.username, password)
      }
    } else {
      // Look up by username
      user = await authenticateUser(identifier, password)
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          message: 'Invalid email/username or password',
        },
        { status: 401 }
      )
    }

    // Check email verification status with grace period
    const db = await getDb()
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        walletAddress: true,
        role: true,
        displayName: true,
      },
    })

    if (fullUser && fullUser.email && !fullUser.emailVerified) {
      const accountAge = Date.now() - fullUser.createdAt.getTime()
      const gracePeriodExpired = accountAge > GRACE_PERIOD_MS

      if (gracePeriodExpired) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email verification required',
            message:
              'Please verify your email address to continue. Check your inbox for the verification link.',
            requiresVerification: true,
            email: fullUser.email,
          },
          { status: 403 }
        )
      }
    }

    // Generate JWT token
    const token = await generateToken(user)

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          walletAddress: user.walletAddress,
          role: user.role,
          displayName: user.displayName,
          emailVerified: fullUser?.emailVerified || false,
        },
        token,
        // Warn if email is unverified but within grace period
        warning:
          fullUser && fullUser.email && !fullUser.emailVerified
            ? 'Please verify your email address to ensure uninterrupted access'
            : undefined,
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
        },
      }
    )
  } catch (error: any) {
    console.error('Login error:', error)

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
