import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'
import { sendPXPReward } from '@/lib/send-pxp-reward'

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
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
 * Submit a YouTube video for PXP rewards (event-based)
 *
 * Request Body:
 * {
 *   youtubeUrl: string // Full YouTube URL
 *   eventId: number    // Event this video is from (required)
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   video: YouTubeVideo
 *   performerPXP: number      // PXP awarded to performer
 *   organizerPXP: number      // PXP awarded to event organizer
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
    const { youtubeUrl, eventId } = body

    // Validate event ID
    if (!eventId || typeof eventId !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Event ID is required. Please select which event this performance is from.',
        },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Verify event exists
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        organizer: {
          select: {
            id: true,
            displayName: true,
            username: true,
            walletAddress: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not found. Please select a valid event.',
        },
        { status: 404 }
      )
    }

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
    const existingVideo = await db.youTubeVideo.findUnique({
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
    const video = await db.youTubeVideo.create({
      data: {
        userId: sessionUser.id,
        eventId: eventId,
        youtubeUrl,
        youtubeId,
        title: videoMetadata.title,
        channelName: videoMetadata.channelName,
        thumbnailUrl: videoMetadata.thumbnailUrl,
        status: 'PENDING', // Awaiting verification
      },
    })

    // Award PXP for video submission
    let showFirstPXPToast = false
    let performerPXP = 0
    let organizerPXP = 0

    try {
      // Get PXP reward amounts from config
      const performerConfig = await db.pXPConfig.findUnique({
        where: { key: 'youtube_upload' },
        select: { value: true, enabled: true },
      })

      const organizerConfig = await db.pXPConfig.findUnique({
        where: { key: 'youtube_upload_organizer' },
        select: { value: true, enabled: true },
      })

      // Get user's current PXP status
      const user = await db.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          walletAddress: true,
          totalPXPEarned: true,
          firstPXPEarnedAt: true,
        },
      })

      if (user) {
        // Check if this is the user's first PXP
        const isFirstPXP = !user.firstPXPEarnedAt && user.totalPXPEarned === 0

        // Award PXP to performer for video submission (from config or default to 100)
        performerPXP = performerConfig && performerConfig.enabled ? performerConfig.value : 100

        // Send on-chain transfer to performer, then update DB on confirmation
        const performerTransfer = await sendPXPReward(
          user.walletAddress ?? '',
          performerPXP,
          `YouTube video submission`
        )

        if (performerTransfer.success) {
          await db.user.update({
            where: { id: user.id },
            data: {
              totalPXPEarned: { increment: performerPXP },
              firstPXPEarnedAt: isFirstPXP ? new Date() : undefined,
            },
          })

          // Update video record with PXP awarded
          await db.youTubeVideo.update({
            where: { id: video.id },
            data: {
              pxpAwarded: performerPXP,
              initialPXPAwarded: true,
            },
          })

          // Set flag to show celebration toast
          showFirstPXPToast = isFirstPXP

          console.log(
            `✅ Awarded ${performerPXP} PXP to performer ${user.id} for YouTube video submission${isFirstPXP ? ' (FIRST PXP!)' : ''}`
          )
        } else {
          console.error(
            `[youtube/submit] Performer PXP transfer failed: ${performerTransfer.error}`
          )
          performerPXP = 0
        }

        // Award PXP to event organizer (if different from performer)
        if (event.organizerId !== sessionUser.id) {
          organizerPXP = organizerConfig && organizerConfig.enabled ? organizerConfig.value : 50

          const organizerTransfer = await sendPXPReward(
            event.organizer.walletAddress ?? '',
            organizerPXP,
            `Event organizer bonus for video submission`
          )

          if (organizerTransfer.success) {
            await db.user.update({
              where: { id: event.organizerId },
              data: {
                totalPXPEarned: { increment: organizerPXP },
              },
            })

            const organizerName =
              event.organizer.displayName || event.organizer.username || `User ${event.organizerId}`

            console.log(
              `✅ Awarded ${organizerPXP} PXP to event organizer ${organizerName} (${event.organizerId})`
            )
          } else {
            console.error(
              `[youtube/submit] Organizer PXP transfer failed: ${organizerTransfer.error}`
            )
            organizerPXP = 0
          }
        }
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
          eventId: video.eventId,
          youtubeId: video.youtubeId,
          youtubeUrl: video.youtubeUrl,
          title: video.title,
          channelName: video.channelName,
          thumbnailUrl: video.thumbnailUrl,
          status: video.status,
          pxpAwarded: performerPXP,
          createdAt: video.createdAt,
        },
        event: {
          id: event.id,
          title: event.title,
          venue: event.venue.name,
        },
        performerPXP,
        organizerPXP,
        totalPXP: performerPXP + organizerPXP,
        showFirstPXPToast,
        message: `Video submitted successfully! Performance at "${event.title}" @ ${event.venue.name}. You earned ${performerPXP} PXP${organizerPXP > 0 ? `, and ${event.organizer.displayName || event.organizer.username} earned ${organizerPXP} PXP as event organizer` : ''}. Verify channel ownership to unlock view milestone rewards.`,
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
 * Get YouTube videos (by user or event)
 *
 * Query Parameters:
 * - userId?: number (optional, fetch user's videos)
 * - eventId?: number (optional, fetch event's videos)
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
    const eventIdParam = searchParams.get('eventId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    // Build where clause
    const whereClause: any = {}

    if (eventIdParam) {
      // Filter by event
      whereClause.eventId = parseInt(eventIdParam)
    } else if (userIdParam) {
      // Filter by user
      whereClause.userId = parseInt(userIdParam)
    } else if (sessionUser?.id) {
      // Default to session user's videos
      whereClause.userId = sessionUser.id
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required or userId/eventId must be provided',
        },
        { status: 401 }
      )
    }

    const db = await getDb()

    // Fetch videos
    const [videos, totalCount] = await Promise.all([
      db.youTubeVideo.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          eventId: true,
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
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              venue: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      db.youTubeVideo.count({
        where: whereClause,
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
