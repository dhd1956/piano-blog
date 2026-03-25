import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'

/**
 * GET /api/musicians
 *
 * WPB-201: Musicians Directory API
 * Returns all users with musician profiles
 * Supports pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Query for users with musician profiles
    // Show all profiles that have musician data (privacy controls can be added later)
    const where = {
      musicianProfile: {
        isNot: null, // Only users with a musician profile
      },
      // Optional: filter by publicProfile if explicitly set to false
      // For now, show all musician profiles
    }

    const db = await getDb()

    // Get total count for pagination
    const totalCount = await db.user.count({ where })

    // Fetch musicians with their profiles
    const musicians = await db.user.findMany({
      where,
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
        avatar: true,
        location: true,
        title: true,
        profileSlug: true,
        totalPXPEarned: true,
        lastActive: true,
        musicianProfile: {
          select: {
            instruments: true,
            musicalStyles: true,
            genres: true,
            experienceLevel: true,
            yearsPlaying: true,
            availableForGigs: true,
            availableForCollab: true,
          },
        },
      },
      orderBy: {
        lastActive: 'desc', // Default: recently active first
      },
      take: limit,
      skip,
    })

    // Calculate pagination metadata
    const hasMore = skip + musicians.length < totalCount
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      musicians,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
      },
    })
  } catch (error) {
    console.error('Error fetching musicians:', error)
    return NextResponse.json({ error: 'Failed to fetch musicians' }, { status: 500 })
  }
}
