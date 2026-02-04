import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { requireRole } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'
import {
  generateEventDates,
  validateRecurrenceConfig,
  validateSeriesDuration,
} from '@/lib/event-series'
import { RecurrencePattern, RecurrenceConfig } from '@/types/event'

/**
 * GET /api/event-series
 *
 * List event series with pagination and filtering
 * Returns series organized by user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filter parameters
    const organizerId = searchParams.get('organizerId')
    const venueId = searchParams.get('venueId')
    const status = searchParams.get('status') || 'ACTIVE'

    // Build where clause
    const where: any = {}

    if (organizerId) {
      where.organizerId = parseInt(organizerId)
    }

    if (venueId) {
      where.venueId = parseInt(venueId)
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    const db = await getDb()

    // Get total count for pagination
    const totalCount = await db.eventSeries.count({ where })

    // Fetch series with relations
    const series = await db.eventSeries.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        eventType: true,
        startTime: true,
        endTime: true,
        timezone: true,
        recurrencePattern: true,
        recurrenceConfig: true,
        seriesStartDate: true,
        seriesEndDate: true,
        status: true,
        maxAttendees: true,
        isFree: true,
        price: true,
        genres: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true,
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
          select: {
            events: true,
          },
        },
      },
      orderBy: {
        seriesStartDate: 'desc',
      },
      take: limit,
      skip,
    })

    // Calculate stats for each series
    const now = new Date()
    const seriesWithStats = await Promise.all(
      series.map(async (s) => {
        // Get upcoming event count
        const upcomingCount = await db.event.count({
          where: {
            seriesId: s.id,
            startDate: { gte: now },
            status: { not: 'CANCELLED' },
          },
        })

        // Get next event date
        const nextEvent = await db.event.findFirst({
          where: {
            seriesId: s.id,
            startDate: { gte: now },
            status: { not: 'CANCELLED' },
          },
          orderBy: { startDate: 'asc' },
          select: { startDate: true },
        })

        return {
          ...s,
          totalEvents: s._count.events,
          upcomingEvents: upcomingCount,
          nextEventDate: nextEvent?.startDate || null,
          _count: undefined,
        }
      })
    )

    // Calculate pagination metadata
    const hasMore = skip + series.length < totalCount
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      series: seriesWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
      },
    })
  } catch (error) {
    console.error('Error fetching event series:', error)
    return NextResponse.json({ error: 'Failed to fetch event series' }, { status: 500 })
  }
}

/**
 * POST /api/event-series
 *
 * Create a new event series and generate event instances
 */
export async function POST(request: NextRequest) {
  try {
    // Only CURATOR and BLOG_OWNER can create series
    const authResult = await requireRole(request, [UserRole.CURATOR, UserRole.BLOG_OWNER])

    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()

    const {
      organizerAddress,
      title,
      description,
      eventType,
      venueId,
      startTime,
      endTime,
      timezone,
      maxAttendees,
      requireApproval,
      isPublic,
      isFree,
      price,
      coverImage,
      genres,
      externalLink,
      streamingLink,
      recurrencePattern,
      recurrenceConfig,
      seriesStartDate,
      seriesEndDate,
    } = body

    // Validate required fields
    if (
      !organizerAddress ||
      !title ||
      !description ||
      !eventType ||
      !venueId ||
      !startTime ||
      !endTime ||
      !recurrencePattern ||
      !seriesStartDate ||
      !seriesEndDate
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: organizerAddress, title, description, eventType, venueId, startTime, endTime, recurrencePattern, seriesStartDate, seriesEndDate',
        },
        { status: 400 }
      )
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

    // Validate venue
    const venue = await db.venue.findUnique({ where: { id: venueId } })
    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    if (!venue.verified) {
      return NextResponse.json(
        { error: 'Events can only be created at verified venues' },
        { status: 400 }
      )
    }

    // Parse dates
    const startDate = new Date(seriesStartDate)
    const endDate = new Date(seriesEndDate)

    // Validate series duration (max 1 year)
    const durationError = validateSeriesDuration(startDate, endDate)
    if (durationError) {
      return NextResponse.json({ error: durationError }, { status: 400 })
    }

    // Validate recurrence config
    const configError = validateRecurrenceConfig(
      recurrencePattern as RecurrencePattern,
      recurrenceConfig as RecurrenceConfig
    )
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 400 })
    }

    // Generate event dates
    const eventDates = generateEventDates({
      pattern: recurrencePattern as RecurrencePattern,
      config: (recurrenceConfig as RecurrenceConfig) || {},
      startDate,
      endDate,
      startTime,
      endTime,
      timezone: timezone || 'America/New_York',
    })

    if (eventDates.length === 0) {
      return NextResponse.json(
        { error: 'No events would be generated with the specified recurrence pattern' },
        { status: 400 }
      )
    }

    // Create series and events in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the series
      const series = await tx.eventSeries.create({
        data: {
          organizerId: organizer.id,
          title,
          description,
          eventType,
          venueId,
          startTime,
          endTime,
          timezone: timezone || 'America/New_York',
          maxAttendees: maxAttendees || null,
          requireApproval: requireApproval || false,
          isPublic: isPublic !== false,
          isFree: isFree !== false,
          price: price || null,
          coverImage: coverImage || null,
          genres: genres || [],
          externalLink: externalLink || null,
          streamingLink: streamingLink || null,
          recurrencePattern,
          recurrenceConfig: recurrenceConfig || {},
          seriesStartDate: startDate,
          seriesEndDate: endDate,
          status: 'ACTIVE',
        },
      })

      // Bulk create events
      const events = await tx.event.createMany({
        data: eventDates.map((ed) => ({
          organizerId: organizer.id,
          seriesId: series.id,
          seriesOccurrence: ed.occurrence,
          isSeriesException: false,
          title,
          description,
          eventType,
          venueId,
          startDate: ed.startDate,
          endDate: ed.endDate,
          timezone: timezone || 'America/New_York',
          maxAttendees: maxAttendees || null,
          requireApproval: requireApproval || false,
          isPublic: isPublic !== false,
          isFree: isFree !== false,
          price: price || null,
          coverImage: coverImage || null,
          genres: genres || [],
          tags: [],
          externalLink: externalLink || null,
          streamingLink: streamingLink || null,
          status: 'UPCOMING',
        })),
      })

      return { series, eventsCreated: events.count }
    })

    // Fetch the complete series with relations
    const completeSeries = await db.eventSeries.findUnique({
      where: { id: result.series.id },
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

    return NextResponse.json(
      {
        series: completeSeries,
        eventsCreated: result.eventsCreated,
        message: `Created series with ${result.eventsCreated} events`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating event series:', error)
    return NextResponse.json({ error: 'Failed to create event series' }, { status: 500 })
  }
}
