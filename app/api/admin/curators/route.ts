/**
 * Curator Management API
 * Handles adding, removing, and listing authorized curators
 * Only accessible by blog owner
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-simplified'

// Helper function to check if requester is blog owner
function isBlogOwner(walletAddress: string | null): boolean {
  if (!walletAddress) return false

  const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS
  if (!blogOwnerAddress) return false

  return walletAddress.toLowerCase() === blogOwnerAddress.toLowerCase()
}

/**
 * GET /api/admin/curators
 * List all authorized curators
 */
export async function GET(request: NextRequest) {
  try {
    // Verify blog owner authentication
    const walletAddress = request.headers.get('x-wallet-address')

    if (!isBlogOwner(walletAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Only the blog owner can manage curators',
        },
        { status: 403 }
      )
    }

    // Get all users who are authorized curators
    const curators = await prisma.user.findMany({
      where: {
        isAuthorizedVerifier: true,
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      curators,
      count: curators.length,
    })
  } catch (error: any) {
    console.error('Error fetching curators:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch curators',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/curators
 * Add a new curator by wallet address
 */
export async function POST(request: NextRequest) {
  try {
    // Verify blog owner authentication
    const walletAddress = request.headers.get('x-wallet-address')

    if (!isBlogOwner(walletAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Only the blog owner can manage curators',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { curatorAddress } = body

    // Validate curator address
    if (!curatorAddress || typeof curatorAddress !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Curator wallet address is required',
        },
        { status: 400 }
      )
    }

    // Validate Ethereum address format
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
    if (!ethAddressRegex.test(curatorAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid address',
          message: 'Invalid Ethereum wallet address format',
        },
        { status: 400 }
      )
    }

    const normalizedAddress = curatorAddress.toLowerCase()

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: {
        walletAddress: normalizedAddress,
      },
    })

    if (user) {
      // User exists, update their curator status
      if (user.isAuthorizedVerifier) {
        return NextResponse.json(
          {
            success: false,
            error: 'Already exists',
            message: 'This user is already an authorized curator',
          },
          { status: 409 }
        )
      }

      user = await prisma.user.update({
        where: {
          walletAddress: normalizedAddress,
        },
        data: {
          isAuthorizedVerifier: true,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new user with curator status
      user = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          isAuthorizedVerifier: true,
          publicProfile: true,
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        curator: {
          id: user.id,
          walletAddress: user.walletAddress,
          username: user.username,
          displayName: user.displayName,
          isAuthorizedVerifier: user.isAuthorizedVerifier,
        },
        message: 'Curator added successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error adding curator:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add curator',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
