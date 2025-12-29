import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-middleware'
import prisma from '@/lib/prisma'

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Fetch video metadata from YouTube (using oEmbed API - no auth required)
 */
async function fetchVideoMetadata(videoId: string) {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const response = await fetch(oEmbedUrl)

    if (!response.ok) {
      throw new Error('Video not found or unavailable')
    }

    const data = await response.json()

    return {
      title: data.title || 'Untitled Video',
      channelName: data.author_name || 'Unknown Channel',
      thumbnailUrl: data.thumbnail_url || null,
    }
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error)
    throw new Error('Failed to fetch video information from YouTube')
  }
}

/**
 * POST /api/content/youtube/submit
 *
 * Submit a YouTube video for PXP rewards
 *
 * Request Body:
 * {
 *   youtubeUrl: string // Full YouTube URL
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   video: YouTubeVideo
 *   pxpEarned: number
 *   showFirstPXPToast: boolean
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const sessionUser = await getSessionUser()

    if (!sessionUser?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please sign in to submit videos.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { youtubeUrl } = body

    // Validate YouTube URL
    if (!youtubeUrl || typeof youtubeUrl !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'YouTube URL is required',
        },
        { status: 400 }
      )
    }

    // Extract video ID
    const youtubeId = extractYouTubeId(youtubeUrl)

    if (!youtubeId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid YouTube URL. Please provide a valid YouTube video link (e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)',
        },
        { status: 400 }
      )
    }

    // Check if video already submitted
    const existingVideo = await prisma.youTubeVideo.findUnique({
      where: { youtubeId },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
      },
    })

    if (existingVideo) {
      const submitterName =
        existingVideo.user.displayName ||
        existingVideo.user.username ||
        `User ${existingVideo.user.id}`

      return NextResponse.json(
        {
          success: false,
          error: `This video has already been submitted by ${submitterName}`,
          errorCode: 'DUPLICATE_VIDEO',
          existingVideoId: existingVideo.id,
        },
        { status: 409 }
      )
    }

    // Fetch video metadata from YouTube
    let videoMetadata
    try {
      videoMetadata = await fetchVideoMetadata(youtubeId)
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to fetch video information from YouTube',
          errorCode: 'YOUTUBE_API_ERROR',
        },
        { status: 400 }
      )
    }

    // Create video record in database
    const video = await prisma.youTubeVideo.create({
      data: {
        userId: sessionUser.id,
        youtubeUrl,
        youtubeId,
        title: videoMetadata.title,
        channelName: videoMetadata.channelName,
        thumbnailUrl: videoMetadata.thumbnailUrl,
        status: 'PENDING', // Awaiting verification
      },
    })

    // Award initial PXP for video submission (100 PXP)
    let showFirstPXPToast = false
    let pxpEarned = 0

    try {
      // Get user's current PXP status
      const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          totalCAVEarned: true,
          firstPXPEarnedAt: true,
        },
      })

      if (user) {
        // Check if this is the user's first PXP
        const isFirstPXP = !user.firstPXPEarnedAt && user.totalCAVEarned === 0

        // Award 100 PXP for video submission
        pxpEarned = 100

        await prisma.user.update({
          where: { id: user.id },
          data: {
            totalCAVEarned: { increment: pxpEarned },
            firstPXPEarnedAt: isFirstPXP ? new Date() : undefined,
          },
        })

        // Update video record with PXP awarded
        await prisma.youTubeVideo.update({
          where: { id: video.id },
          data: {
            pxpAwarded: pxpEarned,
            initialPXPAwarded: true,
          },
        })

        // Set flag to show celebration toast
        showFirstPXPToast = isFirstPXP

        console.log(
          `✅ Awarded ${pxpEarned} PXP to user ${user.id} for YouTube video submission${isFirstPXP ? ' (FIRST PXP!)' : ''}`
        )
      }
    } catch (pxpError) {
      // Don't fail the video submission if PXP awarding fails
      console.error('Error awarding PXP for YouTube video:', pxpError)
    }

    return NextResponse.json(
      {
        success: true,
        video: {
          id: video.id,
          youtubeId: video.youtubeId,
          youtubeUrl: video.youtubeUrl,
          title: video.title,
          channelName: video.channelName,
          thumbnailUrl: video.thumbnailUrl,
          status: video.status,
          pxpAwarded: pxpEarned,
          createdAt: video.createdAt,
        },
        pxpEarned,
        showFirstPXPToast,
        message: `Video submitted successfully! You earned ${pxpEarned} PXP. Verify channel ownership to unlock view milestone rewards.`,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('YouTube video submission error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit YouTube video. Please try again.',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/content/youtube/submit
 *
 * Get user's submitted YouTube videos
 *
 * Query Parameters:
 * - userId?: number (optional, defaults to session user)
 * - limit?: number (default: 10, max: 50)
 * - offset?: number (default: 0)
 *
 * Response:
 * {
 *   success: boolean
 *   videos: YouTubeVideo[]
 *   totalCount: number
 *   hasMore: boolean
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get session user
    const sessionUser = await getSessionUser()

    // Parse query parameters
    const userIdParam = searchParams.get('userId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    // Determine which user's videos to fetch
    let userId: number
    if (userIdParam) {
      userId = parseInt(userIdParam)
    } else if (sessionUser?.id) {
      userId = sessionUser.id
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required or userId must be provided',
        },
        { status: 401 }
      )
    }

    // Fetch videos
    const [videos, totalCount] = await Promise.all([
      prisma.youTubeVideo.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          youtubeId: true,
          youtubeUrl: true,
          title: true,
          channelName: true,
          thumbnailUrl: true,
          viewCount: true,
          pxpAwarded: true,
          initialPXPAwarded: true,
          milestone1kAwarded: true,
          milestone10kAwarded: true,
          verified: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.youTubeVideo.count({
        where: { userId },
      }),
    ])

    return NextResponse.json({
      success: true,
      videos,
      totalCount,
      hasMore: offset + videos.length < totalCount,
      pagination: {
        limit,
        offset,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching YouTube videos:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch YouTube videos',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
