/**
 * Curator Management API
 * Handles adding, removing, and listing authorized curators
 * Only accessible by blog owner
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { requireRole } from '@/lib/auth-middleware'
import { UserRole } from '@prisma/client'

/**
 * GET /api/admin/curators
 * List all authorized curators
 */
export async function GET(request: NextRequest) {
  try {
    // Use role-based middleware
    const authResult = await requireRole(request, [UserRole.BLOG_OWNER])

    // If authentication failed, return the error response
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // User is authenticated as BLOG_OWNER
    const { user: authUser } = authResult
    const db = await getDb()

    // Get all users with CURATOR role
    const curators = await db.user.findMany({
      where: {
        role: { in: [UserRole.CURATOR, UserRole.BLOG_OWNER] },
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
        avatar: true,
        role: true,
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
    // Use role-based middleware
    const authResult = await requireRole(request, [UserRole.BLOG_OWNER])

    // If authentication failed, return the error response
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // User is authenticated as BLOG_OWNER
    const { user: authUser } = authResult
    const db = await getDb()

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
    let user = await db.user.findUnique({
      where: {
        walletAddress: normalizedAddress,
      },
    })

    if (user) {
      // User exists, update their curator status
      if (user.role === UserRole.CURATOR || user.role === UserRole.BLOG_OWNER) {
        return NextResponse.json(
          {
            success: false,
            error: 'Already exists',
            message: 'This user is already an authorized curator',
          },
          { status: 409 }
        )
      }

      user = await db.user.update({
        where: {
          walletAddress: normalizedAddress,
        },
        data: {
          role: UserRole.CURATOR,
          isAuthorizedVerifier: true, // Keep flag synced for backward compat
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new user with curator status
      user = await db.user.create({
        data: {
          walletAddress: normalizedAddress,
          role: UserRole.CURATOR,
          isAuthorizedVerifier: true, // Keep flag synced for backward compat
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
          role: user.role,
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
