import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'

/**
 * GET /api/events/[id]
 *
 * Get event details including RSVPs
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const eventId = parseInt(id)

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const db = await getDb()

    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            profileSlug: true,
            walletAddress: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            slug: true,
            latitude: true,
            longitude: true,
            hasPiano: true,
            pianoType: true,
          },
        },
        rsvps: {
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
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Calculate attendee stats
    const confirmedRSVPs = event.rsvps.filter((rsvp) => rsvp.status === 'CONFIRMED')
    const totalAttendees = confirmedRSVPs.reduce((sum, rsvp) => sum + rsvp.attendeeCount, 0)
    const spotsRemaining = event.maxAttendees ? event.maxAttendees - totalAttendees : null
    const isFull = event.maxAttendees ? totalAttendees >= event.maxAttendees : false

    return NextResponse.json({
      event,
      stats: {
        totalAttendees,
        spotsRemaining,
        isFull,
        confirmedCount: confirmedRSVPs.length,
        pendingCount: event.rsvps.filter((r) => r.status === 'PENDING').length,
        maybeCount: event.rsvps.filter((r) => r.status === 'MAYBE').length,
      },
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

/**
 * PATCH /api/events/[id]
 *
 * Update event details (organizer only)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const eventId = parseInt(id)
    const body = await request.json()

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const { requesterAddress, ...updateData } = body

    if (!requesterAddress) {
      return NextResponse.json({ error: 'Missing requesterAddress' }, { status: 400 })
    }

    const db = await getDb()

    // Find event
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Find requester
    const requester = await db.user.findFirst({
      where: {
        OR: [
          { walletAddress: { equals: requesterAddress, mode: 'insensitive' } },
          { username: { equals: requesterAddress, mode: 'insensitive' } },
          { profileSlug: { equals: requesterAddress, mode: 'insensitive' } },
        ],
      },
    })

    if (!requester) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization (organizer or blog owner can edit)
    const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()
    const isOrganizer = event.organizerId === requester.id
    const isBlogOwner =
      requester.role === 'BLOG_OWNER' ||
      (blogOwnerAddress && requester.walletAddress?.toLowerCase() === blogOwnerAddress)

    if (!isOrganizer && !isBlogOwner) {
      return NextResponse.json(
        { error: 'Only the event organizer or blog owner can edit this event' },
        { status: 403 }
      )
    }

    // Validate venue if being updated
    if (updateData.venueId !== undefined) {
      if (!updateData.venueId) {
        return NextResponse.json(
          { error: 'Venue is required - cannot be removed from event' },
          { status: 400 }
        )
      }

      const venue = await db.venue.findUnique({ where: { id: updateData.venueId } })
      if (!venue) {
        return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
      }

      if (!venue.verified) {
        return NextResponse.json(
          { error: 'Events can only be associated with verified venues' },
          { status: 400 }
        )
      }
    }

    // Remove customLocation from update data (field no longer exists)
    const { customLocation, ...safeUpdateData } = updateData as any

    // Update event
    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: {
        ...safeUpdateData,
        // Convert date strings to Date objects if provided
        startDate: safeUpdateData.startDate ? new Date(safeUpdateData.startDate) : undefined,
        endDate: safeUpdateData.endDate ? new Date(safeUpdateData.endDate) : undefined,
      },
      include: {
        organizer: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            profileSlug: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ event: updatedEvent })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

/**
 * DELETE /api/events/[id]
 *
 * Cancel event (organizer only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const requesterAddress = searchParams.get('requesterAddress')
    const cancellationReason = searchParams.get('reason')

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    if (!requesterAddress) {
      return NextResponse.json({ error: 'Missing requesterAddress' }, { status: 400 })
    }

    const db = await getDb()

    // Find event
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { organizer: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Find requester
    const requester = await db.user.findFirst({
      where: {
        OR: [
          { walletAddress: { equals: requesterAddress, mode: 'insensitive' } },
          { username: { equals: requesterAddress, mode: 'insensitive' } },
          { profileSlug: { equals: requesterAddress, mode: 'insensitive' } },
        ],
      },
    })

    if (!requester) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization (organizer or blog owner can cancel)
    const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()
    const isOrganizer = event.organizerId === requester.id
    const isBlogOwner =
      requester.role === 'BLOG_OWNER' ||
      (blogOwnerAddress && requester.walletAddress?.toLowerCase() === blogOwnerAddress)

    if (!isOrganizer && !isBlogOwner) {
      return NextResponse.json(
        { error: 'Only the event organizer or blog owner can cancel this event' },
        { status: 403 }
      )
    }

    // Cancel event (don't actually delete, just mark as cancelled)
    const cancelledEvent = await db.event.update({
      where: { id: eventId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: cancellationReason || 'No reason provided',
      },
    })

    return NextResponse.json({ event: cancelledEvent })
  } catch (error) {
    console.error('Error cancelling event:', error)
    return NextResponse.json({ error: 'Failed to cancel event' }, { status: 500 })
  }
}
