/**
 * POST /api/events/[id]/performers
 *
 * Marks an RSVP'd attendee as a performer at the event and awards event_perform PXP (50 PXP).
 * Only the event organizer can call this.
 *
 * Body: { userId: number }
 *
 * GET /api/events/[id]/performers
 * Returns all performers for the event.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { requireAuth } from '@/lib/auth-middleware'
import { awardEventPerform } from '@/lib/pxp-rewards'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request as any)
    if (authResult instanceof NextResponse) return authResult
    const { user: caller } = authResult

    const { id } = await params
    const eventId = parseInt(id)
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const body = await request.json()
    const { userId } = body
    if (!userId || typeof userId !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid userId' }, { status: 400 })
    }

    const db = await getDb()

    // Verify event exists and caller is the organizer
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, organizerId: true },
    })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    if (event.organizerId !== caller.id) {
      return NextResponse.json(
        { error: 'Only the event organizer can mark performers' },
        { status: 403 }
      )
    }

    // Find the RSVP for this user
    const rsvp = await db.eventRSVP.findUnique({
      where: { eventId_userId: { eventId, userId } },
      include: {
        user: { select: { id: true, walletAddress: true, displayName: true, username: true } },
      },
    })
    if (!rsvp) {
      return NextResponse.json({ error: 'User has no RSVP for this event' }, { status: 404 })
    }
    if (rsvp.isPerformer) {
      return NextResponse.json({ error: 'User is already marked as a performer' }, { status: 409 })
    }

    // Mark as performer
    await db.eventRSVP.update({
      where: { id: rsvp.id },
      data: { isPerformer: true },
    })

    // Award PXP (on-chain + DB), track with performerPXPAwarded flag
    let pxpAwarded = 0
    if (!rsvp.performerPXPAwarded && rsvp.user.walletAddress) {
      const result = await awardEventPerform(rsvp.user.id, eventId, rsvp.user.walletAddress)
      if (result.success) {
        await db.eventRSVP.update({
          where: { id: rsvp.id },
          data: { performerPXPAwarded: true },
        })
        pxpAwarded = result.pxpAwarded
      }
    }

    return NextResponse.json({
      success: true,
      pxpAwarded,
      message:
        pxpAwarded > 0
          ? `${rsvp.user.displayName || rsvp.user.username} marked as performer. +${pxpAwarded} PXP awarded.`
          : `${rsvp.user.displayName || rsvp.user.username} marked as performer.`,
    })
  } catch (error: any) {
    console.error('Mark performer error:', error)
    return NextResponse.json({ error: 'Failed to mark performer' }, { status: 500 })
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const eventId = parseInt(id)
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const db = await getDb()
    const performers = await db.eventRSVP.findMany({
      where: { eventId, isPerformer: true },
      select: {
        id: true,
        performerPXPAwarded: true,
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            profileSlug: true,
          },
        },
      },
    })

    return NextResponse.json({ performers })
  } catch (error: any) {
    console.error('Fetch performers error:', error)
    return NextResponse.json({ error: 'Failed to fetch performers' }, { status: 500 })
  }
}
