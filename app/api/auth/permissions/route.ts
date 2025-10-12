/**
 * Permissions Check API
 * Returns permission status for a connected wallet
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-simplified'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('address')

    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing parameter',
          message: 'Wallet address is required',
        },
        { status: 400 }
      )
    }

    const normalizedAddress = walletAddress.toLowerCase()

    // Check if user is blog owner
    const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()
    const isBlogOwner = normalizedAddress === blogOwnerAddress

    // Check if user is in database as authorized curator
    let isAuthorizedCurator = isBlogOwner // Blog owner is always a curator

    if (!isAuthorizedCurator) {
      const user = await prisma.user.findUnique({
        where: {
          walletAddress: normalizedAddress,
        },
        select: {
          isAuthorizedVerifier: true,
        },
      })

      isAuthorizedCurator = user?.isAuthorizedVerifier || false
    }

    const canAccessCurator = isBlogOwner || isAuthorizedCurator

    return NextResponse.json({
      success: true,
      permissions: {
        isBlogOwner,
        isAuthorizedCurator,
        canAccessCurator,
      },
    })
  } catch (error: any) {
    console.error('Error checking permissions:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check permissions',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
