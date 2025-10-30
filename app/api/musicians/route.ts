import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    // Only include public profiles for now
    const where = {
      publicProfile: true,
      musicianProfile: {
        isNot: null, // Only users with a musician profile
      },
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where })

    // Fetch musicians with their profiles
    const musicians = await prisma.user.findMany({
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
        totalCAVEarned: true,
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
  } finally {
    await prisma.$disconnect()
  }
}
