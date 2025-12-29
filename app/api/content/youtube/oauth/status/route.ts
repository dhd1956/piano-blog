import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-middleware'
import prisma from '@/lib/prisma'

/**
 * GET /api/content/youtube/oauth/status
 *
 * Checks YouTube channel verification status for the current user.
 *
 * Authorization: Authenticated user only
 *
 * Response:
 * {
 *   verified: boolean,
 *   channelId?: string,
 *   channelName?: string,
 *   verifiedAt?: string,
 *   tokenExpiry?: string,
 *   needsReauth?: boolean // If token has expired
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionUser = await getSessionUser()

    if (!sessionUser?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Fetch user's YouTube verification status
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        youtubeChannelId: true,
        youtubeChannelName: true,
        youtubeVerifiedAt: true,
        youtubeTokenExpiry: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      )
    }

    // Check if channel is verified
    const verified = !!user.youtubeChannelId

    // Check if token has expired (needs re-authentication)
    const needsReauth =
      verified && user.youtubeTokenExpiry ? new Date(user.youtubeTokenExpiry) < new Date() : false

    return NextResponse.json(
      {
        success: true,
        verified,
        channelId: user.youtubeChannelId || undefined,
        channelName: user.youtubeChannelName || undefined,
        verifiedAt: user.youtubeVerifiedAt?.toISOString(),
        tokenExpiry: user.youtubeTokenExpiry?.toISOString(),
        needsReauth,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking YouTube verification status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check verification status',
      },
      { status: 500 }
    )
  }
}
