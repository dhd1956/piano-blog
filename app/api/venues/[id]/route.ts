/**
 * Single Venue API Route - Simplified Architecture
 * Handles individual venue data from PostgreSQL only
 */

import { NextRequest, NextResponse } from 'next/server'
import { VenueService, AnalyticsService, prisma } from '@/lib/database-simplified'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const venueId = id

    // Get venue by ID or slug
    const venue = await VenueService.getVenue(venueId)

    if (!venue) {
      return NextResponse.json(
        {
          error: 'Venue not found',
        },
        {
          status: 404,
        }
      )
    }

    // Track venue view for analytics
    const isUnique = request.headers.get('x-unique-view') === 'true'
    await AnalyticsService.trackVenueView(venue.id, isUnique)

    return NextResponse.json({
      venue,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Venue detail API error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch venue',
        message: error.message,
      },
      {
        status: 500,
      }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const venueId = parseInt(id)
    const body = await request.json()

    if (isNaN(venueId)) {
      return NextResponse.json(
        {
          error: 'Invalid venue ID',
        },
        {
          status: 400,
        }
      )
    }

    // Get existing venue
    const existingVenue = await VenueService.getVenue(venueId)
    if (!existingVenue) {
      return NextResponse.json(
        {
          error: 'Venue not found',
        },
        {
          status: 404,
        }
      )
    }

    // Update venue (this would require authentication in production)
    const updatedVenue = await prisma.venue.update({
      where: { id: venueId },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      venue: updatedVenue,
      message: 'Venue updated successfully.',
    })
  } catch (error: any) {
    console.error('Venue update error:', error)

    return NextResponse.json(
      {
        error: 'Failed to update venue',
        message: error.message,
      },
      {
        status: 500,
      }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const venueId = parseInt(id)

    if (isNaN(venueId)) {
      return NextResponse.json(
        {
          error: 'Invalid venue ID',
        },
        {
          status: 400,
        }
      )
    }

    // Hard delete venue (simplified approach)
    await prisma.venue.delete({
      where: { id: venueId },
    })

    return NextResponse.json({
      message: 'Venue deleted successfully',
    })
  } catch (error: any) {
    console.error('Venue deletion error:', error)

    return NextResponse.json(
      {
        error: 'Failed to delete venue',
        message: error.message,
      },
      {
        status: 500,
      }
    )
  }
}
