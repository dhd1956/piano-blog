import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-middleware'
import type { LeaderboardResponse, LeaderboardEntry } from '@/types/leaderboard'

/**
 * GET /api/leaderboard
 *
 * Returns ranked list of users by PXP earned
 * Respects privacy settings (publicProfile + showPXPBalance)
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    // Get authenticated user (optional)
    const sessionUser = await getSessionUser()

    // Count total eligible users
    const totalCount = await prisma.user.count({
      where: {
        publicProfile: true,
        showPXPBalance: true,
        totalCAVEarned: { gt: 0 },
      },
    })

    // Fetch leaderboard users
    const users = await prisma.user.findMany({
      where: {
        publicProfile: true,
        showPXPBalance: true,
        totalCAVEarned: { gt: 0 },
      },
      select: {
        id: true,
        displayName: true,
        username: true,
        walletAddress: true,
        profileSlug: true,
        avatar: true,
        location: true,
        totalCAVEarned: true,
        badges: true,
      },
      orderBy: {
        totalCAVEarned: 'desc',
      },
      take: limit,
      skip: skip,
    })

    // Fetch venue counts for all users in batch
    const walletAddresses = users.map((u) => u.walletAddress).filter(Boolean) as string[]
    const venueCounts = await prisma.venue.groupBy({
      by: ['submittedBy'],
      where: {
        submittedBy: { in: walletAddresses },
      },
      _count: true,
    })

    // Fetch review counts for all users in batch
    const userIds = users.map((u) => u.id)
    const reviewCounts = await prisma.venueReview.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
      },
      _count: true,
    })

    // Create lookup maps
    const venueCountMap = new Map(venueCounts.map((vc) => [vc.submittedBy, vc._count]))
    const reviewCountMap = new Map(reviewCounts.map((rc) => [rc.userId, rc._count]))

    // Build leaderboard entries
    const leaderboard: LeaderboardEntry[] = users.map((user, index) => ({
      rank: skip + index + 1,
      userId: user.id,
      displayName: user.displayName || user.username || `User ${user.id}`,
      username: user.username || undefined,
      avatar: user.avatar || undefined,
      location: user.location || undefined,
      totalPXPEarned: user.totalCAVEarned,
      badges: user.badges || [],
      venuesDiscovered: venueCountMap.get(user.walletAddress || '') || 0,
      reviewCount: reviewCountMap.get(user.id) || 0,
      profileIdentifier: user.profileSlug || user.walletAddress || user.username || String(user.id),
    }))

    // Get current user's rank if authenticated
    let currentUser = undefined
    if (sessionUser?.id) {
      // Get user's rank
      const usersAhead = await prisma.user.count({
        where: {
          publicProfile: true,
          showPXPBalance: true,
          totalCAVEarned: {
            gt: sessionUser.totalCAVEarned || 0,
          },
        },
      })
      const rank = usersAhead + 1

      // Get user's data
      const userData = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          displayName: true,
          username: true,
          walletAddress: true,
          profileSlug: true,
          avatar: true,
          location: true,
          totalCAVEarned: true,
          badges: true,
        },
      })

      if (userData) {
        const userVenueCount = await prisma.venue.count({
          where: { submittedBy: userData.walletAddress || '' },
        })
        const userReviewCount = await prisma.venueReview.count({
          where: { userId: userData.id },
        })

        currentUser = {
          rank,
          entry: {
            rank,
            userId: userData.id,
            displayName: userData.displayName || userData.username || `User ${userData.id}`,
            username: userData.username || undefined,
            avatar: userData.avatar || undefined,
            location: userData.location || undefined,
            totalPXPEarned: userData.totalCAVEarned,
            badges: userData.badges || [],
            venuesDiscovered: userVenueCount,
            reviewCount: userReviewCount,
            profileIdentifier:
              userData.profileSlug ||
              userData.walletAddress ||
              userData.username ||
              String(userData.id),
          },
        }
      }
    }

    const response: LeaderboardResponse = {
      leaderboard,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount,
      },
      currentUser,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
