/**
 * Delete User Profile API
 * Allows blog owner to delete any user profile and musician profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    const body = await request.json()

    // Authentication: Only blog owner can delete profiles
    const requesterAddress = body.requesterAddress?.toLowerCase()
    const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()

    if (!requesterAddress) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const isBlogOwner = requesterAddress === blogOwnerAddress

    if (!isBlogOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: Only blog owner can delete profiles' },
        { status: 403 }
      )
    }

    const db = await getDb()

    // Find the user to delete
    const user = await db.user.findFirst({
      where: {
        OR: [
          { walletAddress: { equals: address, mode: 'insensitive' } },
          { username: { equals: address, mode: 'insensitive' } },
        ],
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent blog owner from deleting themselves
    if (user.walletAddress?.toLowerCase() === blogOwnerAddress) {
      return NextResponse.json({ error: 'Cannot delete your own profile' }, { status: 400 })
    }

    // Delete musician profile first (if exists)
    const musicianProfile = await db.musicianProfile.findUnique({
      where: { userId: user.id },
    })

    if (musicianProfile) {
      await db.musicianProfile.delete({
        where: { userId: user.id },
      })
    }

    // Delete reviews
    await db.venueReview.deleteMany({
      where: { userId: user.id },
    })

    // Delete sessions
    await db.session.deleteMany({
      where: { userId: user.id },
    })

    // Delete user
    await db.user.delete({
      where: { id: user.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting profile:', error)
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
  }
}
