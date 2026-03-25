/**
 * POST /api/venues/[id]/photos
 *
 * Upload a photo URL for a venue and award venue_photo PXP (10 PXP, once per user per venue).
 * Body: { url: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { requireAuth } from '@/lib/auth-middleware'
import { sendPXPReward } from '@/lib/send-pxp-reward'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request as any)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const { id } = await params
    const venueId = parseInt(id)
    if (isNaN(venueId)) {
      return NextResponse.json({ error: 'Invalid venue ID' }, { status: 400 })
    }

    const body = await request.json()
    const { url } = body
    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'Missing photo url' }, { status: 400 })
    }

    const db = await getDb()

    // Confirm venue exists and is active
    const venue = await db.venue.findUnique({
      where: { id: venueId },
      select: { id: true, name: true, isActive: true },
    })
    if (!venue || !venue.isActive) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Check if user already uploaded this exact URL for this venue (unique constraint guard)
    const existing = await db.venuePhoto.findUnique({
      where: { venueId_userId_url: { venueId, userId: user.id, url: url.trim() } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Photo already uploaded' }, { status: 409 })
    }

    // Check if user has already received venue_photo PXP for this venue
    const priorPhoto = await db.venuePhoto.findFirst({
      where: { venueId, userId: user.id, pxpAwarded: true },
    })
    const eligibleForPXP = !priorPhoto

    // Create the photo record
    const photo = await db.venuePhoto.create({
      data: {
        venueId,
        userId: user.id,
        url: url.trim(),
        pxpAwarded: false,
      },
    })

    // Award PXP if eligible (first photo for this venue by this user)
    let pxpAwarded = 0
    if (eligibleForPXP && user.walletAddress) {
      const config = await db.pXPConfig.findUnique({
        where: { key: 'venue_photo' },
        select: { value: true, enabled: true },
      })
      const rewardAmount = config && config.enabled ? config.value : 10

      const transfer = await sendPXPReward(
        user.walletAddress,
        rewardAmount,
        `Venue photo upload: ${venue.name}`
      )

      if (transfer.success) {
        await Promise.all([
          db.venuePhoto.update({
            where: { id: photo.id },
            data: { pxpAwarded: true },
          }),
          db.user.update({
            where: { id: user.id },
            data: { totalPXPEarned: { increment: rewardAmount } },
          }),
        ])
        pxpAwarded = rewardAmount
        console.log(
          `✅ Awarded ${rewardAmount} PXP (on-chain + DB) to user ${user.id} for photo upload at venue ${venue.name}`
        )
      } else {
        console.error(
          `[venue photos] On-chain transfer failed for user ${user.id}: ${transfer.error}`
        )
      }
    }

    return NextResponse.json({
      photo,
      pxpAwarded,
      message: pxpAwarded > 0 ? `Photo uploaded! +${pxpAwarded} PXP earned.` : 'Photo uploaded.',
    })
  } catch (error: any) {
    console.error('Venue photo upload error:', error)
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
  }
}

/**
 * GET /api/venues/[id]/photos
 *
 * Returns all photos for a venue.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const venueId = parseInt(id)
    if (isNaN(venueId)) {
      return NextResponse.json({ error: 'Invalid venue ID' }, { status: 400 })
    }

    const db = await getDb()
    const photos = await db.venuePhoto.findMany({
      where: { venueId },
      select: {
        id: true,
        url: true,
        createdAt: true,
        user: { select: { displayName: true, username: true, profileSlug: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ photos })
  } catch (error: any) {
    console.error('Venue photos fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
  }
}
