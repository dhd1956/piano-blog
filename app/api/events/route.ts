import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { requireRole } from '@/lib/auth-middleware'
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
    const venueId = searchParams.get('venueId') // Filter by venue
    const organizerId = searchParams.get('organizerId') // Filter by organizer

    // Build where clause
    const where: any = {
      isPublic: true,
    }

    if (eventType) {
      where.eventType = eventType
    }

    if (status) {
      where.status = status
    }

    if (venueId) {
      where.venueId = parseInt(venueId)
    }

    if (organizerId) {
      where.organizerId = parseInt(organizerId)
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
    // Only CURATOR and BLOG_OWNER can create events
    const authResult = await requireRole(request, [UserRole.CURATOR, UserRole.BLOG_OWNER])

    // If authentication failed, return the error response
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // User is authenticated as CURATOR or BLOG_OWNER
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
