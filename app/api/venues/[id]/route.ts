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

    // Map frontend fields to database schema
    const updateData: any = {}

    // Basic fields
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.fullAddress !== undefined) updateData.address = body.fullAddress // Map fullAddress -> address
    if (body.contactInfo !== undefined) updateData.contactInfo = body.contactInfo
    if (body.website !== undefined) updateData.website = body.website
    if (body.phone !== undefined) updateData.phone = body.phone

    // Social media - combine into socialLinks JSON
    const socialLinks: any = {}
    if (body.facebook !== undefined) socialLinks.facebook = body.facebook
    if (body.instagram !== undefined) socialLinks.instagram = body.instagram
    if (body.twitter !== undefined) socialLinks.twitter = body.twitter
    if (Object.keys(socialLinks).length > 0) {
      updateData.socialLinks = socialLinks
    }

    // Operational info - combine into operatingHours JSON
    if (body.operatingHours !== undefined) {
      updateData.operatingHours = { notes: body.operatingHours }
    }

    // Accessibility - combine into accessibility JSON
    const accessibility: any = {}
    if (body.wheelchairAccessible !== undefined)
      accessibility.wheelchairAccessible = body.wheelchairAccessible
    if (body.parkingAvailable !== undefined) accessibility.parkingAvailable = body.parkingAvailable
    if (body.publicTransportNear !== undefined)
      accessibility.publicTransportNear = body.publicTransportNear
    if (Object.keys(accessibility).length > 0) {
      updateData.accessibility = accessibility
    }

    // Special notes -> ambiance
    if (body.specialNotes !== undefined) {
      updateData.ambiance = { atmosphere: body.specialNotes }
    }

    // Note: Piano/Jam/Curator fields are not in the simplified schema
    // They would need to be added to schema or stored in a separate table

    // Update venue
    const updatedVenue = await prisma.venue.update({
      where: { id: venueId },
      data: updateData,
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

    // Verify authentication - only blog owner can delete venues
    const walletAddress = request.headers.get('x-wallet-address')
    const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS

    if (!walletAddress) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Wallet address not provided',
        },
        {
          status: 401,
        }
      )
    }

    if (!blogOwnerAddress) {
      return NextResponse.json(
        {
          error: 'Configuration error',
          message: 'Blog owner address not configured',
        },
        {
          status: 500,
        }
      )
    }

    // Check if the wallet address matches the blog owner
    if (walletAddress.toLowerCase() !== blogOwnerAddress.toLowerCase()) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Only the blog owner can delete venues',
        },
        {
          status: 403,
        }
      )
    }

    // Get venue before deletion to verify it exists
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

    // Hard delete venue
    await prisma.venue.delete({
      where: { id: venueId },
    })

    return NextResponse.json({
      success: true,
      message: 'Venue deleted successfully',
      deletedVenue: {
        id: existingVenue.id,
        name: existingVenue.name,
      },
    })
  } catch (error: any) {
    console.error('Venue deletion error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete venue',
        message: error.message,
      },
      {
        status: 500,
      }
    )
  }
}
