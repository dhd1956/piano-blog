import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { sendPXPReward } from '@/lib/send-pxp-reward'

/**
 * Fetch current view count from YouTube Data API v3
 * Requires YOUTUBE_API_KEY environment variable
 */
async function fetchViewCount(videoId: string): Promise<number | null> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY not configured, skipping view count check')
    return null
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`YouTube API returned ${response.status}`)
    }

    const data = await response.json()

    if (data.items && data.items.length > 0) {
      const viewCount = parseInt(data.items[0].statistics.viewCount || '0')
      return viewCount
    }

    return null
  } catch (error) {
    console.error(`Error fetching view count for video ${videoId}:`, error)
    return null
  }
}

/**
 * Award milestone PXP to user via on-chain transfer, then update DB.
 */
async function awardMilestonePXP(
  videoId: number,
  userId: number,
  walletAddress: string,
  milestone: '1k' | '10k'
): Promise<number> {
  const pxpAmount = milestone === '1k' ? 150 : 200
  const milestoneField = milestone === '1k' ? 'milestone1kAwarded' : 'milestone10kAwarded'

  try {
    // Send on-chain transfer first
    const transfer = await sendPXPReward(
      walletAddress,
      pxpAmount,
      `YouTube ${milestone} views milestone (video ${videoId})`
    )

    if (!transfer.success) {
      console.error(
        `[awardMilestonePXP] On-chain transfer failed for user ${userId}: ${transfer.error}`
      )
      return 0
    }

    const db = await getDb()
    // Award PXP to user in DB (after on-chain confirmation)
    await db.user.update({
      where: { id: userId },
      data: {
        totalCAVEarned: { increment: pxpAmount },
      },
    })

    // Update video record
    await db.youTubeVideo.update({
      where: { id: videoId },
      data: {
        [milestoneField]: true,
        pxpAwarded: { increment: pxpAmount },
      },
    })

    console.log(
      `✅ Awarded ${pxpAmount} PXP to user ${userId} for ${milestone} views milestone on video ${videoId}`
    )

    return pxpAmount
  } catch (error) {
    console.error(`Error awarding ${milestone} milestone PXP:`, error)
    return 0
  }
}

/**
 * POST /api/content/youtube/check-milestones
 *
 * Cron job endpoint to check view counts and award milestone PXP
 *
 * This endpoint should be called periodically (e.g., every hour) by a cron service
 * like Vercel Cron or an external scheduler.
 *
 * Authorization: Requires CRON_SECRET environment variable to prevent unauthorized access
 *
 * Request Headers:
 * - Authorization: Bearer {CRON_SECRET}
 *
 * Response:
 * {
 *   success: boolean
 *   videosChecked: number
 *   milestonesAwarded: number
 *   pxpAwarded: number
 *   errors: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    // Check if YouTube API is configured
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'YouTube API key not configured',
          message: 'Set YOUTUBE_API_KEY environment variable to enable view count tracking',
        },
        { status: 500 }
      )
    }

    console.log('🔄 Starting YouTube view count check...')

    const db = await getDb()

    // Fetch all verified videos that haven't reached all milestones yet
    const videos = await db.youTubeVideo.findMany({
      where: {
        verified: true,
        status: 'APPROVED',
        OR: [{ milestone1kAwarded: false }, { milestone10kAwarded: false }],
      },
      select: {
        id: true,
        youtubeId: true,
        userId: true,
        viewCount: true,
        milestone1kAwarded: true,
        milestone10kAwarded: true,
        title: true,
        user: {
          select: { walletAddress: true },
        },
      },
      orderBy: {
        lastChecked: 'asc', // Check oldest first
      },
      take: 100, // Limit to 100 videos per run to avoid rate limits
    })

    let videosChecked = 0
    let milestonesAwarded = 0
    let totalPXPAwarded = 0
    const errors: string[] = []

    for (const video of videos) {
      try {
        // Fetch current view count from YouTube
        const currentViewCount = await fetchViewCount(video.youtubeId)

        if (currentViewCount === null) {
          errors.push(`Failed to fetch view count for video ${video.youtubeId}`)
          continue
        }

        videosChecked++

        // Update video view count and last checked time
        await db.youTubeVideo.update({
          where: { id: video.id },
          data: {
            viewCount: currentViewCount,
            lastChecked: new Date(),
          },
        })

        const userWalletAddress = video.user?.walletAddress ?? ''

        // Check for 1k milestone
        if (!video.milestone1kAwarded && currentViewCount >= 1000) {
          const pxpAwarded = await awardMilestonePXP(
            video.id,
            video.userId,
            userWalletAddress,
            '1k'
          )
          if (pxpAwarded > 0) {
            milestonesAwarded++
            totalPXPAwarded += pxpAwarded
            console.log(`🎉 Video "${video.title}" reached 1,000 views!`)
          }
        }

        // Check for 10k milestone
        if (!video.milestone10kAwarded && currentViewCount >= 10000) {
          const pxpAwarded = await awardMilestonePXP(
            video.id,
            video.userId,
            userWalletAddress,
            '10k'
          )
          if (pxpAwarded > 0) {
            milestonesAwarded++
            totalPXPAwarded += pxpAwarded
            console.log(`🎉 Video "${video.title}" reached 10,000 views!`)
          }
        }

        // Small delay to avoid rate limiting (YouTube API has quota limits)
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error: any) {
        errors.push(`Error processing video ${video.youtubeId}: ${error.message}`)
        console.error(`Error processing video ${video.youtubeId}:`, error)
      }
    }

    console.log(`✅ View count check complete:
      - Videos checked: ${videosChecked}
      - Milestones awarded: ${milestonesAwarded}
      - Total PXP awarded: ${totalPXPAwarded}
      - Errors: ${errors.length}
    `)

    return NextResponse.json({
      success: true,
      videosChecked,
      milestonesAwarded,
      pxpAwarded: totalPXPAwarded,
      errors,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('YouTube milestone check error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check YouTube milestones',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/content/youtube/check-milestones
 *
 * Get information about the milestone tracking system
 *
 * Response:
 * {
 *   configured: boolean
 *   videosEligible: number
 *   nextMilestones: Array
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const configured = !!process.env.YOUTUBE_API_KEY
    const db = await getDb()

    // Count videos eligible for milestone tracking
    const videosEligible = await db.youTubeVideo.count({
      where: {
        verified: true,
        status: 'APPROVED',
        OR: [{ milestone1kAwarded: false }, { milestone10kAwarded: false }],
      },
    })

    // Get videos close to milestones
    const closeToMilestone = await db.youTubeVideo.findMany({
      where: {
        verified: true,
        status: 'APPROVED',
        OR: [
          {
            AND: [
              { milestone1kAwarded: false },
              { viewCount: { gte: 800 } }, // Within 200 views of 1k
            ],
          },
          {
            AND: [
              { milestone10kAwarded: false },
              { viewCount: { gte: 9000 } }, // Within 1000 views of 10k
            ],
          },
        ],
      },
      select: {
        id: true,
        youtubeId: true,
        title: true,
        viewCount: true,
        milestone1kAwarded: true,
        milestone10kAwarded: true,
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
      },
      take: 10,
      orderBy: {
        viewCount: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      configured,
      videosEligible,
      nextMilestones: closeToMilestone.map((video) => ({
        videoId: video.id,
        youtubeId: video.youtubeId,
        title: video.title,
        currentViews: video.viewCount,
        nextMilestone: !video.milestone1kAwarded
          ? { type: '1k', viewsNeeded: 1000 - video.viewCount, pxpReward: 150 }
          : { type: '10k', viewsNeeded: 10000 - video.viewCount, pxpReward: 200 },
        user: video.user.displayName || video.user.username || `User ${video.user.id}`,
      })),
      message: configured
        ? 'YouTube milestone tracking is configured and active'
        : 'YouTube milestone tracking requires YOUTUBE_API_KEY environment variable',
    })
  } catch (error: any) {
    console.error('Error fetching milestone info:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch milestone tracking information',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
