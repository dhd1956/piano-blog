/**
 * Venues API Route
 * Handles venue data from PostgreSQL only - simplified architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { VenueService } from '@/lib/database-simplified'
import { authenticate } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // When myCurated=true, restrict to venues assigned to the calling curator
    let curatedByUserId: number | undefined
    if (searchParams.get('myCurated') === 'true') {
      const user = await authenticate(request as any)
      if (user) curatedByUserId = user.id
    }

    // Parse query parameters
    const options = {
      city: searchParams.get('city') || undefined,
      hasPiano: searchParams.get('hasPiano') ? searchParams.get('hasPiano') === 'true' : undefined,
      verified: searchParams.get('verified') ? searchParams.get('verified') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100),
      offset: Math.max(parseInt(searchParams.get('offset') || '0'), 0),
      orderBy: (searchParams.get('orderBy') as 'name' | 'rating' | 'createdAt') || 'createdAt',
      orderDirection: (searchParams.get('orderDirection') as 'asc' | 'desc') || 'desc',
      includeDeleted: searchParams.get('includeDeleted') === 'true', // For curator/admin views
      curatedByUserId,
    }

    // Get venues from PostgreSQL
    const result = await VenueService.getVenues(options)

    return NextResponse.json({
      success: true,
      venues: result.venues,
      totalCount: result.totalCount,
      hasMore: result.hasMore,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        currentPage: Math.floor(options.offset / options.limit) + 1,
        totalPages: Math.ceil(result.totalCount / options.limit),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Venues API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load venues',
        details: error.message,
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'city', 'submittedBy']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          {
            status: 400,
          }
        )
      }
    }

    // Validate at least one contact method
    if (!body.email && !body.phone && !body.website && !body.contactInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide at least one contact method (email, phone, or website)',
        },
        {
          status: 400,
        }
      )
    }

    // Create venue in PostgreSQL only
    const venue = await VenueService.createVenue({
      name: body.name.trim(),
      city: body.city.trim(),
      province: body.province?.trim() || undefined,
      country: body.country?.trim() || undefined,
      contactInfo: body.contactInfo,
      contactType: body.contactType || 'email',
      submittedBy: body.submittedBy.toLowerCase(),
      hasPiano: body.hasPiano || false,
      hasJamSession: body.hasJamSession || false,
      isVirtual: body.isVirtual || false,
      venueType: body.venueType ?? 0,
      description: body.description,
      address: body.isVirtual ? undefined : body.address || body.fullAddress || undefined,
      streamingLink: body.streamingLink || undefined,
      phone: body.phone,
      website: body.website,
      amenities: body.amenities || [],
      tags: body.tags || [],
    })

    // PXP is awarded when a curator verifies the venue, not on submission
    return NextResponse.json(
      {
        success: true,
        venue,
        message: 'Venue submitted successfully! It will be reviewed by our curators.',
      },
      {
        status: 201,
      }
    )
  } catch (error: any) {
    console.error('Venue submission error:', error)

    // Handle duplicate venue errors with specific messages
    if (error.code === 'DUPLICATE_VENUE' || error.code === 'DUPLICATE_VENUE_HASH') {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorCode: error.code,
          existingVenueId: error.existingVenueId,
        },
        {
          status: 409, // Conflict
        }
      )
    }

    if (error.code === 'DUPLICATE_SLUG') {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorCode: error.code,
        },
        {
          status: 409, // Conflict
        }
      )
    }

    // Handle Prisma unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error:
            'This venue appears to be a duplicate. A venue with the same name or details already exists.',
          errorCode: 'DUPLICATE_VENUE',
          details: error.message,
        },
        {
          status: 409,
        }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit venue. Please try again.',
        details: error.message,
      },
      {
        status: 500,
      }
    )
  }
}
