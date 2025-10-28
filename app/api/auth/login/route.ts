/**
 * Login API Route
 * Authenticates users with username/password or wallet address
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken, getUserByWallet, upsertWalletUser } from '@/lib/auth'
import { z } from 'zod'

// Validation schemas
const usernameLoginSchema = z.object({
  username: z.string().min(3),
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
            details: validation.error.errors,
          },
          { status: 400 }
        )
      }

      // For wallet-based auth, we just upsert the user (creates if doesn't exist)
      const user = await upsertWalletUser(validation.data.walletAddress)

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
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
          },
        }
      )
    }

    // Username/password authentication
    const validation = usernameLoginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Invalid username or password format',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { username, password } = validation.data

    // Authenticate user
    const user = await authenticateUser(username, password)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          message: 'Invalid username or password',
        },
        { status: 401 }
      )
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
        },
        token,
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
