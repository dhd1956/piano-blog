import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { requireRole } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'
import {
  generateEventDates,
  validateRecurrenceConfig,
  validateSeriesDuration,
  getRecurrenceDescription,
} from '@/lib/event-series'
import { RecurrencePattern, RecurrenceConfig } from '@/types/event'

/**
 * GET /api/event-series/[id]
 *
 * Get series details with all events and stats
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const seriesId = parseInt(id)

    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'Invalid series ID' }, { status: 400 })
    }

    const db = await getDb()

    const series = await db.eventSeries.findUnique({
      where: { id: seriesId },
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
        events: {
          orderBy: { startDate: 'asc' },
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            status: true,
            seriesOccurrence: true,
            isSeriesException: true,
            _count: {
              select: {
                rsvps: true,
              },
            },
          },
        },
      },
    })

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }

    // Calculate stats
    const now = new Date()
    const upcomingEvents = series.events.filter(
      (e) => new Date(e.startDate) >= now && e.status !== 'CANCELLED'
    )
    const completedEvents = series.events.filter(
      (e) => new Date(e.startDate) < now || e.status === 'COMPLETED'
    )
    const cancelledEvents = series.events.filter((e) => e.status === 'CANCELLED')

    // Get recurrence description
    const recurrenceDescription = getRecurrenceDescription(
      series.recurrencePattern as RecurrencePattern,
      series.recurrenceConfig as RecurrenceConfig
    )

    return NextResponse.json({
      series: {
        ...series,
        recurrenceDescription,
      },
      stats: {
        totalEvents: series.events.length,
        upcomingEvents: upcomingEvents.length,
        completedEvents: completedEvents.length,
        cancelledEvents: cancelledEvents.length,
        nextEventDate: upcomingEvents.length > 0 ? upcomingEvents[0].startDate : null,
      },
    })
  } catch (error) {
    console.error('Error fetching event series:', error)
    return NextResponse.json({ error: 'Failed to fetch event series' }, { status: 500 })
  }
}

/**
 * PATCH /api/event-series/[id]
 *
 * Update series template and future events
 * - Updates series template fields
 * - Updates all future events (not past, not exceptions)
 * - If recurrence pattern changed, regenerates future events
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const seriesId = parseInt(id)

    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'Invalid series ID' }, { status: 400 })
    }

    // Only CURATOR and BLOG_OWNER can update series
    const authResult = await requireRole(request, [UserRole.CURATOR, UserRole.BLOG_OWNER])

    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const { requesterAddress, regenerateEvents, ...updateData } = body

    if (!requesterAddress) {
      return NextResponse.json({ error: 'Missing requesterAddress' }, { status: 400 })
    }

    const db = await getDb()

    // Find series
    const series = await db.eventSeries.findUnique({
      where: { id: seriesId },
      include: { organizer: true },
    })

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
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

    // Check authorization
    const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()
    const isOrganizer = series.organizerId === requester.id
    const isBlogOwner =
      requester.role === 'BLOG_OWNER' ||
      (blogOwnerAddress && requester.walletAddress?.toLowerCase() === blogOwnerAddress)

    if (!isOrganizer && !isBlogOwner) {
      return NextResponse.json(
        { error: 'Only the series organizer or blog owner can edit this series' },
        { status: 403 }
      )
    }

    // Validate venue if being updated
    if (updateData.venueId !== undefined) {
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

    // Validate new recurrence config if provided
    if (updateData.recurrencePattern && updateData.recurrenceConfig) {
      const configError = validateRecurrenceConfig(
        updateData.recurrencePattern as RecurrencePattern,
        updateData.recurrenceConfig as RecurrenceConfig
      )
      if (configError) {
        return NextResponse.json({ error: configError }, { status: 400 })
      }
    }

    // Validate new date range if provided
    if (updateData.seriesStartDate || updateData.seriesEndDate) {
      const newStartDate = updateData.seriesStartDate
        ? new Date(updateData.seriesStartDate)
        : series.seriesStartDate
      const newEndDate = updateData.seriesEndDate
        ? new Date(updateData.seriesEndDate)
        : series.seriesEndDate

      const durationError = validateSeriesDuration(newStartDate, newEndDate)
      if (durationError) {
        return NextResponse.json({ error: durationError }, { status: 400 })
      }
    }

    const now = new Date()

    // Check if recurrence pattern or dates changed (requires regeneration)
    const recurrenceChanged =
      regenerateEvents ||
      updateData.recurrencePattern ||
      updateData.recurrenceConfig ||
      updateData.seriesStartDate ||
      updateData.seriesEndDate ||
      updateData.startTime ||
      updateData.endTime

    // Prepare series update data
    const seriesUpdateData: any = {}
    const templateFields = [
      'title',
      'description',
      'eventType',
      'venueId',
      'startTime',
      'endTime',
      'timezone',
      'maxAttendees',
      'requireApproval',
      'isPublic',
      'isFree',
      'price',
      'coverImage',
      'genres',
      'externalLink',
      'streamingLink',
      'recurrencePattern',
      'recurrenceConfig',
    ]

    for (const field of templateFields) {
      if (updateData[field] !== undefined) {
        seriesUpdateData[field] = updateData[field]
      }
    }

    // Handle date updates
    if (updateData.seriesStartDate) {
      seriesUpdateData.seriesStartDate = new Date(updateData.seriesStartDate)
    }
    if (updateData.seriesEndDate) {
      seriesUpdateData.seriesEndDate = new Date(updateData.seriesEndDate)
    }

    let eventsUpdated = 0
    let eventsCreated = 0
    let eventsDeleted = 0

    if (recurrenceChanged) {
      // Delete future non-exception events and regenerate
      await db.$transaction(async (tx) => {
        // Update series first
        await tx.eventSeries.update({
          where: { id: seriesId },
          data: seriesUpdateData,
        })

        // Delete future events that are not exceptions
        const deleteResult = await tx.event.deleteMany({
          where: {
            seriesId: seriesId,
            startDate: { gt: now },
            isSeriesException: false,
          },
        })
        eventsDeleted = deleteResult.count

        // Get updated series for regeneration
        const updatedSeries = await tx.eventSeries.findUnique({
          where: { id: seriesId },
        })

        if (updatedSeries) {
          // Generate new future events
          const newStartDate =
            updatedSeries.seriesStartDate > now ? updatedSeries.seriesStartDate : now
          const eventDates = generateEventDates({
            pattern: updatedSeries.recurrencePattern as RecurrencePattern,
            config: updatedSeries.recurrenceConfig as RecurrenceConfig,
            startDate: newStartDate,
            endDate: updatedSeries.seriesEndDate,
            startTime: updatedSeries.startTime,
            endTime: updatedSeries.endTime,
            timezone: updatedSeries.timezone,
          })

          // Get the max occurrence number from existing events
          const maxOccurrence = await tx.event.aggregate({
            where: { seriesId: seriesId },
            _max: { seriesOccurrence: true },
          })
          const occurrenceOffset = maxOccurrence._max.seriesOccurrence || 0

          if (eventDates.length > 0) {
            const createResult = await tx.event.createMany({
              data: eventDates.map((ed, index) => ({
                organizerId: updatedSeries.organizerId,
                seriesId: seriesId,
                seriesOccurrence: occurrenceOffset + index + 1,
                isSeriesException: false,
                title: updatedSeries.title,
                description: updatedSeries.description,
                eventType: updatedSeries.eventType,
                venueId: updatedSeries.venueId,
                startDate: ed.startDate,
                endDate: ed.endDate,
                timezone: updatedSeries.timezone,
                maxAttendees: updatedSeries.maxAttendees,
                requireApproval: updatedSeries.requireApproval,
                isPublic: updatedSeries.isPublic,
                isFree: updatedSeries.isFree,
                price: updatedSeries.price,
                coverImage: updatedSeries.coverImage,
                genres: updatedSeries.genres,
                tags: [],
                externalLink: updatedSeries.externalLink,
                streamingLink: updatedSeries.streamingLink,
                status: 'UPCOMING',
              })),
            })
            eventsCreated = createResult.count
          }
        }
      })
    } else {
      // Just update template fields on series and future non-exception events
      await db.$transaction(async (tx) => {
        // Update series
        await tx.eventSeries.update({
          where: { id: seriesId },
          data: seriesUpdateData,
        })

        // Update future events (not exceptions)
        const eventUpdateData: any = {}
        const eventFields = [
          'title',
          'description',
          'eventType',
          'venueId',
          'timezone',
          'maxAttendees',
          'requireApproval',
          'isPublic',
          'isFree',
          'price',
          'coverImage',
          'genres',
          'externalLink',
          'streamingLink',
        ]

        for (const field of eventFields) {
          if (updateData[field] !== undefined) {
            eventUpdateData[field] = updateData[field]
          }
        }

        if (Object.keys(eventUpdateData).length > 0) {
          const updateResult = await tx.event.updateMany({
            where: {
              seriesId: seriesId,
              startDate: { gt: now },
              isSeriesException: false,
            },
            data: eventUpdateData,
          })
          eventsUpdated = updateResult.count
        }
      })
    }

    // Fetch updated series
    const updatedSeries = await db.eventSeries.findUnique({
      where: { id: seriesId },
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
        _count: {
          select: { events: true },
        },
      },
    })

    return NextResponse.json({
      series: updatedSeries,
      changes: {
        eventsUpdated,
        eventsCreated,
        eventsDeleted,
      },
    })
  } catch (error) {
    console.error('Error updating event series:', error)
    return NextResponse.json({ error: 'Failed to update event series' }, { status: 500 })
  }
}

/**
 * DELETE /api/event-series/[id]
 *
 * Cancel a series - marks series and all future events as cancelled
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const seriesId = parseInt(id)

    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'Invalid series ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const requesterAddress = searchParams.get('requesterAddress')
    const cancellationReason = searchParams.get('reason')

    if (!requesterAddress) {
      return NextResponse.json({ error: 'Missing requesterAddress' }, { status: 400 })
    }

    const db = await getDb()

    // Find series
    const series = await db.eventSeries.findUnique({
      where: { id: seriesId },
      include: { organizer: true },
    })

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
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

    // Check authorization
    const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()
    const isOrganizer = series.organizerId === requester.id
    const isBlogOwner =
      requester.role === 'BLOG_OWNER' ||
      (blogOwnerAddress && requester.walletAddress?.toLowerCase() === blogOwnerAddress)

    if (!isOrganizer && !isBlogOwner) {
      return NextResponse.json(
        { error: 'Only the series organizer or blog owner can cancel this series' },
        { status: 403 }
      )
    }

    const now = new Date()

    // Cancel series and future events in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update series status
      await tx.eventSeries.update({
        where: { id: seriesId },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancellationReason: cancellationReason || 'No reason provided',
        },
      })

      // Cancel all future events
      const cancelResult = await tx.event.updateMany({
        where: {
          seriesId: seriesId,
          startDate: { gt: now },
          status: { not: 'CANCELLED' },
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancellationReason: cancellationReason || 'Series cancelled',
        },
      })

      return { eventsCancelled: cancelResult.count }
    })

    // Fetch updated series
    const cancelledSeries = await db.eventSeries.findUnique({
      where: { id: seriesId },
      select: {
        id: true,
        title: true,
        status: true,
        cancelledAt: true,
        cancellationReason: true,
      },
    })

    return NextResponse.json({
      series: cancelledSeries,
      eventsCancelled: result.eventsCancelled,
    })
  } catch (error) {
    console.error('Error cancelling event series:', error)
    return NextResponse.json({ error: 'Failed to cancel event series' }, { status: 500 })
  }
}
