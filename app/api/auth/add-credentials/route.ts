import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { ethers } from 'ethers'

const prisma = new PrismaClient()

/**
 * POST /api/auth/add-credentials
 * Adds username and password to an existing wallet-only user account
 * Requires wallet signature to prove ownership
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, username, password, signature, message } = await request.json()

    // Validate required fields
    if (!walletAddress || !username || !password || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, username, password, signature, message' },
        { status: 400 }
      )
    }

    // Normalize wallet address
    const normalizedAddress = walletAddress.toLowerCase()

    // Verify signature to prove wallet ownership
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature)
      if (recoveredAddress.toLowerCase() !== normalizedAddress) {
        return NextResponse.json(
          { error: 'Invalid signature: wallet address does not match' },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error('Signature verification failed:', error)
      return NextResponse.json({ error: 'Invalid signature format' }, { status: 401 })
    }

    // Find the wallet-based user
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No user found with this wallet address. Please connect your wallet first.' },
        { status: 404 }
      )
    }

    // Check if user already has username
    if (user.username) {
      return NextResponse.json(
        {
          error: `This wallet account already has a username: ${user.username}`,
          existingUsername: user.username,
        },
        { status: 400 }
      )
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error:
            'Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores',
        },
        { status: 400 }
      )
    }

    // Check if username is already taken
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken. Please choose a different username.' },
        { status: 409 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update user with username and password
    const updatedUser = await prisma.user.update({
      where: { walletAddress: normalizedAddress },
      data: {
        username: username.toLowerCase(),
        passwordHash,
        displayName: username, // Set displayName to username if not already set
      },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        displayName: true,
        email: true,
        role: true,
      },
    })

    console.log(`✅ Added credentials to wallet account: ${normalizedAddress} → ${username}`)

    return NextResponse.json({
      success: true,
      message: 'Username and password added successfully! You can now log in with either method.',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error adding credentials:', error)
    return NextResponse.json(
      { error: 'Internal server error while adding credentials' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
