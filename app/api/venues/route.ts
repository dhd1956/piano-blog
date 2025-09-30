/**
 * Venues API Route
 * Handles venue data from PostgreSQL only - simplified architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { VenueService } from '@/lib/database-simplified'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

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
    const requiredFields = ['name', 'city', 'contactInfo', 'submittedBy']
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

    // Create venue in PostgreSQL only
    const venue = await VenueService.createVenue({
      name: body.name,
      city: body.city,
      contactInfo: body.contactInfo,
      contactType: body.contactType || 'email',
      submittedBy: body.submittedBy.toLowerCase(),
      hasPiano: body.hasPiano || false,
      hasJamSession: body.hasJamSession || false,
      description: body.description,
      address: body.address,
      phone: body.phone,
      website: body.website,
      amenities: body.amenities || [],
      tags: body.tags || [],
    })

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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit venue',
        details: error.message,
      },
      {
        status: 500,
      }
    )
  }
}
