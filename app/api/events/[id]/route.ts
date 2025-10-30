import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/events/[id]
 *
 * Get event details including RSVPs
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = parseInt(params.id)

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const event = await prisma.event.findUnique({
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
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * PATCH /api/events/[id]
 *
 * Update event details (organizer only)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = parseInt(params.id)
    const body = await request.json()

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const { requesterAddress, ...updateData } = body

    if (!requesterAddress) {
      return NextResponse.json({ error: 'Missing requesterAddress' }, { status: 400 })
    }

    // Find event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Find requester
    const requester = await prisma.user.findFirst({
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

    // Check authorization (only organizer can edit)
    if (event.organizerId !== requester.id) {
      return NextResponse.json(
        { error: 'Only the event organizer can edit this event' },
        { status: 403 }
      )
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...updateData,
        // Convert date strings to Date objects if provided
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
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
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * DELETE /api/events/[id]
 *
 * Cancel event (organizer only)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const requesterAddress = searchParams.get('requesterAddress')
    const cancellationReason = searchParams.get('reason')

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    if (!requesterAddress) {
      return NextResponse.json({ error: 'Missing requesterAddress' }, { status: 400 })
    }

    // Find event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Find requester
    const requester = await prisma.user.findFirst({
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

    // Check authorization
    if (event.organizerId !== requester.id) {
      return NextResponse.json(
        { error: 'Only the event organizer can cancel this event' },
        { status: 403 }
      )
    }

    // Cancel event (don't actually delete, just mark as cancelled)
    const cancelledEvent = await prisma.event.update({
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
  } finally {
    await prisma.$disconnect()
  }
}
