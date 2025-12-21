/**
 * Curator Management API - Individual Curator Operations
 * DELETE endpoint to remove a curator
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-simplified'
import { requireRole } from '@/lib/auth-middleware'
import { UserRole } from '@prisma/client'

/**
 * DELETE /api/admin/curators/[address]
 * Remove curator permissions from a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    // Use role-based middleware
    const authResult = await requireRole(request, [UserRole.BLOG_OWNER])
    if (!authResult.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Only the blog owner can manage curators',
        },
        { status: 403 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Prevent blog owner from removing themselves
    const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()
    if (normalizedAddress === blogOwnerAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid operation',
          message: 'Cannot remove blog owner from curators',
        },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: {
        walletAddress: normalizedAddress,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'User not found',
        },
        { status: 404 }
      )
    }

    if (user.role !== UserRole.CURATOR && user.role !== UserRole.BLOG_OWNER) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not a curator',
          message: 'This user is not an authorized curator',
        },
        { status: 400 }
      )
    }

    // Demote to SCOUT role
    const updatedUser = await prisma.user.update({
      where: {
        walletAddress: normalizedAddress,
      },
      data: {
        role: UserRole.SCOUT,
        isAuthorizedVerifier: false, // Keep flag synced for backward compat
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Curator removed successfully - demoted to SCOUT role',
      user: {
        id: updatedUser.id,
        walletAddress: updatedUser.walletAddress,
        username: updatedUser.username,
        role: updatedUser.role,
      },
    })
  } catch (error: any) {
    console.error('Error removing curator:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove curator',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
