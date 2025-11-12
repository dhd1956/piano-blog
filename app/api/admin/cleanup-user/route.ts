import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Admin API endpoint to clean up a user profile and all associated data
 *
 * Usage:
 * POST /api/admin/cleanup-user
 * Headers:
 *   - x-admin-key: <ADMIN_API_KEY from env>
 * Body:
 *   - identifier: username, wallet address, or display name
 *   - confirm: true (required for safety)
 *
 * This endpoint will:
 * 1. Verify admin authentication
 * 2. Find the user by username, wallet address, or display name
 * 3. Delete associated musician profile, reviews, and sessions
 * 4. Delete the user account
 *
 * WARNING: This action cannot be undone!
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminKey = request.headers.get('x-admin-key')
    const expectedKey = process.env.ADMIN_API_KEY

    if (!expectedKey) {
      return NextResponse.json(
        { error: 'Admin API not configured (ADMIN_API_KEY missing)' },
        { status: 500 }
      )
    }

    if (!adminKey || adminKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized - Invalid admin key' }, { status: 401 })
    }

    const body = await request.json()
    const { identifier, confirm } = body

    if (!identifier) {
      return NextResponse.json({ error: 'Missing required field: identifier' }, { status: 400 })
    }

    if (!confirm) {
      return NextResponse.json(
        { error: 'Must set confirm: true to proceed with deletion' },
        { status: 400 }
      )
    }

    console.log(`🔍 Admin cleanup: Searching for user: ${identifier}`)

    // Find user by username, wallet address, or display name
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { walletAddress: { equals: identifier, mode: 'insensitive' } },
          { displayName: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      include: {
        musicianProfile: true,
        reviews: true,
        sessions: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found', identifier }, { status: 404 })
    }

    const userInfo = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      walletAddress: user.walletAddress,
      email: user.email,
      createdAt: user.createdAt,
      associatedData: {
        hasMusicianProfile: !!user.musicianProfile,
        reviewCount: user.reviews.length,
        sessionCount: user.sessions.length,
      },
    }

    console.log('✅ Found user:', JSON.stringify(userInfo, null, 2))
    console.log('🗑️  Deleting user data...')

    // Delete associated records first
    const deletedData = {
      musicianProfile: false,
      sessionsDeleted: 0,
      reviewsDeleted: 0,
    }

    if (user.musicianProfile) {
      await prisma.musicianProfile.delete({ where: { id: user.musicianProfile.id } })
      deletedData.musicianProfile = true
      console.log('   ✓ Deleted musician profile')
    }

    if (user.sessions.length > 0) {
      const result = await prisma.session.deleteMany({ where: { userId: user.id } })
      deletedData.sessionsDeleted = result.count
      console.log(`   ✓ Deleted ${result.count} session(s)`)
    }

    if (user.reviews.length > 0) {
      const result = await prisma.venueReview.deleteMany({ where: { userId: user.id } })
      deletedData.reviewsDeleted = result.count
      console.log(`   ✓ Deleted ${result.count} review(s)`)
    }

    // Delete user
    await prisma.user.delete({ where: { id: user.id } })
    console.log('   ✓ Deleted user account')
    console.log('✅ User cleanup completed successfully')

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      user: userInfo,
      deletedData,
    })
  } catch (error: any) {
    console.error('❌ Error during cleanup:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET endpoint to check if user exists (read-only, safer)
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminKey = request.headers.get('x-admin-key')
    const expectedKey = process.env.ADMIN_API_KEY

    if (!expectedKey) {
      return NextResponse.json(
        { error: 'Admin API not configured (ADMIN_API_KEY missing)' },
        { status: 500 }
      )
    }

    if (!adminKey || adminKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized - Invalid admin key' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const identifier = searchParams.get('identifier')

    if (!identifier) {
      return NextResponse.json({ error: 'Missing query parameter: identifier' }, { status: 400 })
    }

    // Find user by username, wallet address, or display name
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { walletAddress: { equals: identifier, mode: 'insensitive' } },
          { displayName: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      include: {
        musicianProfile: true,
        reviews: {
          select: { id: true },
        },
        sessions: {
          select: { id: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ found: false, identifier }, { status: 404 })
    }

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        walletAddress: user.walletAddress,
        email: user.email,
        createdAt: user.createdAt,
        associatedData: {
          hasMusicianProfile: !!user.musicianProfile,
          reviewCount: user.reviews.length,
          sessionCount: user.sessions.length,
        },
      },
    })
  } catch (error: any) {
    console.error('Error checking user:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
