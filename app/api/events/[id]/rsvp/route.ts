import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'

/**
 * POST /api/events/[id]/rsvp
 *
 * WPB-211: RSVP to an event
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const eventId = parseInt(id)
    const body = await request.json()

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const { userAddress, status, attendeeCount, notes } = body

    if (!userAddress) {
      return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 })
    }

    if (!status || !['PENDING', 'CONFIRMED', 'DECLINED', 'MAYBE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid RSVP status' }, { status: 400 })
    }

    const db = await getDb()

    // Find user
    const user = await db.user.findFirst({
      where: {
        OR: [
          { walletAddress: { equals: userAddress, mode: 'insensitive' } },
          { username: { equals: userAddress, mode: 'insensitive' } },
          { profileSlug: { equals: userAddress, mode: 'insensitive' } },
        ],
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find event
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        rsvps: {
          where: { status: 'CONFIRMED' },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if event is cancelled
    if (event.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot RSVP to a cancelled event' }, { status: 400 })
    }

    // Check if event is full (only if user is trying to confirm)
    if (status === 'CONFIRMED' && event.maxAttendees) {
      const totalAttendees = event.rsvps.reduce((sum, rsvp) => sum + rsvp.attendeeCount, 0)
      const requestedCount = attendeeCount || 1

      if (totalAttendees + requestedCount > event.maxAttendees) {
        return NextResponse.json(
          {
            error: 'Event is full',
            maxAttendees: event.maxAttendees,
            currentAttendees: totalAttendees,
            spotsRemaining: event.maxAttendees - totalAttendees,
          },
          { status: 400 }
        )
      }
    }

    // Determine initial status based on event settings
    let finalStatus = status
    if (status === 'CONFIRMED' && event.requireApproval) {
      finalStatus = 'PENDING' // Organizer must approve
    }

    // Create or update RSVP
    const rsvp = await db.eventRSVP.upsert({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: user.id,
        },
      },
      create: {
        eventId: eventId,
        userId: user.id,
        status: finalStatus,
        attendeeCount: attendeeCount || 1,
        notes: notes || null,
        respondedAt: new Date(),
      },
      update: {
        status: finalStatus,
        attendeeCount: attendeeCount || 1,
        notes: notes || null,
        respondedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            profileSlug: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            organizerId: true,
          },
        },
      },
    })

    // Award PXP for event attendance (only for CONFIRMED status)
    if (finalStatus === 'CONFIRMED') {
      try {
        const { awardEventAttendance, awardReferralFirstEvent } = await import('@/lib/pxp-rewards')

        // Award PXP to user for attending event
        await awardEventAttendance(user.id, eventId, user.walletAddress ?? '')

        // Award referral PXP to referrer if this is user's first event
        await awardReferralFirstEvent(user.id)
      } catch (error) {
        console.error('Error awarding event RSVP PXP:', error)
        // Don't fail the RSVP if PXP award fails
      }
    }

    return NextResponse.json({
      rsvp,
      message:
        finalStatus === 'PENDING'
          ? 'RSVP submitted. Waiting for organizer approval.'
          : 'RSVP updated successfully',
    })
  } catch (error) {
    console.error('Error creating RSVP:', error)
    return NextResponse.json({ error: 'Failed to create RSVP' }, { status: 500 })
  }
}

/**
 * PATCH /api/events/[id]/rsvp
 *
 * Update RSVP status (for organizer approval)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const eventId = parseInt(id)
    const body = await request.json()

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const { organizerAddress, rsvpId, status } = body

    if (!organizerAddress || !rsvpId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = await getDb()

    // Find organizer
    const organizer = await db.user.findFirst({
      where: {
        OR: [
          { walletAddress: { equals: organizerAddress, mode: 'insensitive' } },
          { username: { equals: organizerAddress, mode: 'insensitive' } },
          { profileSlug: { equals: organizerAddress, mode: 'insensitive' } },
        ],
      },
    })

    if (!organizer) {
      return NextResponse.json({ error: 'Organizer not found' }, { status: 404 })
    }

    // Find event and verify organizer
    const event = await db.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organizerId !== organizer.id) {
      return NextResponse.json(
        { error: 'Only the event organizer can approve RSVPs' },
        { status: 403 }
      )
    }

    // Update RSVP
    const rsvp = await db.eventRSVP.update({
      where: { id: rsvpId },
      data: {
        status,
        respondedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ rsvp })
  } catch (error) {
    console.error('Error updating RSVP:', error)
    return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 })
  }
}

/**
 * DELETE /api/events/[id]/rsvp
 *
 * Cancel RSVP
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    if (!userAddress) {
      return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 })
    }

    const db = await getDb()

    // Find user
    const user = await db.user.findFirst({
      where: {
        OR: [
          { walletAddress: { equals: userAddress, mode: 'insensitive' } },
          { username: { equals: userAddress, mode: 'insensitive' } },
          { profileSlug: { equals: userAddress, mode: 'insensitive' } },
        ],
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete RSVP
    await db.eventRSVP.delete({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: user.id,
        },
      },
    })

    return NextResponse.json({ message: 'RSVP cancelled successfully' })
  } catch (error) {
    console.error('Error deleting RSVP:', error)
    return NextResponse.json({ error: 'Failed to cancel RSVP' }, { status: 500 })
  }
}
