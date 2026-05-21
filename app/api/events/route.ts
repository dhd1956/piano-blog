import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { requireAuth, requireRole } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'

/**
 * GET /api/events
 *
 * WPB-210: Events Directory API
 * Returns all public events with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filter parameters
    const eventType = searchParams.get('type') // JAM_SESSION, GIG, etc.
    const status = searchParams.get('status') || 'UPCOMING' // UPCOMING, ONGOING, COMPLETED, CANCELLED
    const venueId = searchParams.get('venueId') // Filter by venue ID
    const organizerId = searchParams.get('organizerId') // Filter by organizer
    const city = searchParams.get('city')?.trim() || '' // Filter by venue city
    const venueName = searchParams.get('venueName')?.trim() || '' // Filter by venue name
    const dateFrom = searchParams.get('dateFrom') // ISO date string — events on/after this date
    const dateTo = searchParams.get('dateTo') // ISO date string — events on/before this date

    // Build where clause
    const where: any = {
      isPublic: true,
    }

    if (eventType) {
      where.eventType = eventType
    }

    if (status === 'PAST') {
      // Past: any non-cancelled event whose end date has passed
      where.status = { not: 'CANCELLED' }
      where.endDate = { lt: new Date() }
    } else if (status) {
      where.status = status
      // For upcoming events, only show events that haven't ended yet
      if (status === 'UPCOMING') {
        where.endDate = { gte: new Date() }
      }
    }

    if (venueId) {
      where.venueId = parseInt(venueId)
    }

    if (organizerId) {
      where.organizerId = parseInt(organizerId)
    }

    if (city || venueName) {
      where.venue = {
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(venueName && { name: { contains: venueName, mode: 'insensitive' } }),
      }
    }

    if (dateFrom || dateTo) {
      where.startDate = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo + 'T23:59:59Z') }),
      }
    }

    const db = await getDb()

    // Get total count for pagination
    const totalCount = await db.event.count({ where })

    // Fetch events with relations
    const events = await db.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        eventType: true,
        startDate: true,
        endDate: true,
        timezone: true,
        address: true,
        latitude: true,
        longitude: true,
        maxAttendees: true,
        requireApproval: true,
        isFree: true,
        price: true,
        coverImage: true,
        genres: true,
        tags: true,
        externalLink: true,
        streamingLink: true,
        status: true,
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
            province: true,
            country: true,
            address: true,
            slug: true,
          },
        },
        rsvps: {
          select: {
            id: true,
            status: true,
            attendeeCount: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc', // Upcoming events first
      },
      take: limit,
      skip,
    })

    // Calculate attendee counts and availability
    const eventsWithStats = events.map((event) => {
      const confirmedRSVPs = event.rsvps.filter((rsvp) => rsvp.status === 'CONFIRMED')
      const totalAttendees = confirmedRSVPs.reduce((sum, rsvp) => sum + rsvp.attendeeCount, 0)
      const spotsRemaining = event.maxAttendees ? event.maxAttendees - totalAttendees : null
      const isFull = event.maxAttendees ? totalAttendees >= event.maxAttendees : false

      return {
        ...event,
        totalAttendees,
        spotsRemaining,
        isFull,
        rsvpCount: event.rsvps.length,
        // Remove detailed rsvps from response (include stats only)
        rsvps: undefined,
      }
    })

    // Calculate pagination metadata
    const hasMore = skip + events.length < totalCount
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      events: eventsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
      },
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

/**
 * POST /api/events
 *
 * WPB-209: Create Event
 * Creates a new event
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication; venue-curator check happens after body is parsed
    const authResult = await requireAuth(request)

    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user: authUser } = authResult

    const body = await request.json()

    const {
      organizerAddress, // Wallet address or username
      title,
      description,
      eventType,
      venueId,
      customLocation,
      address,
      latitude,
      longitude,
      startDate,
      endDate,
      timezone,
      maxAttendees,
      requireApproval,
      isPublic,
      isFree,
      price,
      coverImage,
      genres,
      tags,
      externalLink,
      streamingLink,
    } = body

    // Validate required fields
    if (
      !organizerAddress ||
      !title ||
      !description ||
      !eventType ||
      !venueId ||
      !startDate ||
      !endDate
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: organizerAddress, title, description, eventType, venueId, startDate, endDate',
        },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Allow BLOG_OWNER/CURATOR (global role) or a user assigned as curator for this venue
    const isGloballyAuthorized =
      authUser.role === UserRole.BLOG_OWNER || authUser.role === UserRole.CURATOR
    if (!isGloballyAuthorized) {
      const venueAssignment = await db.venueCurator.findUnique({
        where: { venueId_userId: { venueId, userId: authUser.id } },
      })
      if (!venueAssignment) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You must be a curator for this venue to create events' },
          { status: 403 }
        )
      }
    }

    // Find or create organizer
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

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start >= end) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Validate venue (required)
    const venue = await db.venue.findUnique({ where: { id: venueId } })
    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Optional: Enforce verified venues only
    if (!venue.verified) {
      return NextResponse.json(
        { error: 'Events can only be created at verified venues' },
        { status: 400 }
      )
    }

    // Create event
    const event = await db.event.create({
      data: {
        organizerId: organizer.id,
        title,
        description,
        eventType,
        venueId, // Required - never null
        address: address || null,
        latitude: latitude || null,
        longitude: longitude || null,
        startDate: start,
        endDate: end,
        timezone: timezone || 'America/New_York',
        maxAttendees: maxAttendees || null,
        requireApproval: requireApproval || false,
        isPublic: isPublic !== false, // Default to true
        isFree: isFree !== false, // Default to true
        price: price || null,
        coverImage: coverImage || null,
        genres: genres || [],
        tags: tags || [],
        externalLink: externalLink || null,
        streamingLink: streamingLink || null,
        status: 'UPCOMING',
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
            province: true,
            country: true,
            address: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
