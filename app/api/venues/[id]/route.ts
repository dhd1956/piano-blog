/**
 * Single Venue API Route - Simplified Architecture
 * Handles individual venue data from PostgreSQL only
 */

import { NextRequest, NextResponse } from 'next/server'
import { VenueService, AnalyticsService, prisma } from '@/lib/database-simplified'
import { requireRole, can } from '@/lib/auth-middleware'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const venueId = id

    // Get venue by ID or slug (without heavy relations to avoid serialization issues)
    const where =
      typeof venueId === 'number'
        ? { id: venueId }
        : isNaN(Number(venueId))
          ? { slug: venueId }
          : { id: Number(venueId) }

    const venue = await prisma.venue.findUnique({
      where,
      // Don't include relations that might cause serialization issues
      // The frontend doesn't need reviews, verifications, analytics here
    })

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

    // Track venue view for analytics (non-blocking)
    try {
      const isUnique = request.headers.get('x-unique-view') === 'true'
      await AnalyticsService.trackVenueView(venue.id, isUnique)
    } catch (analyticsError) {
      // Log but don't fail the request
      console.error('Analytics tracking error:', analyticsError)
    }

    // Safely serialize the venue data, excluding circular references
    const safeVenue = JSON.parse(JSON.stringify(venue))

    return NextResponse.json({
      venue: safeVenue,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Venue detail API error:', error)
    console.error('Error stack:', error.stack)

    return NextResponse.json(
      {
        error: 'Failed to fetch venue',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      {
        status: 500,
      }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require CURATOR or BLOG_OWNER role
    const authResult = await requireRole(request as any, [UserRole.CURATOR, UserRole.BLOG_OWNER])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

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

    // Piano-specific fields
    if (body.pianoType !== undefined) updateData.pianoType = body.pianoType
    if (body.pianoCondition !== undefined) updateData.pianoCondition = body.pianoCondition
    if (body.pianoBrand !== undefined) updateData.pianoBrand = body.pianoBrand
    if (body.lastTuned !== undefined) updateData.lastTuned = body.lastTuned

    // Jam session fields
    if (body.jamSchedule !== undefined) updateData.jamSchedule = body.jamSchedule
    if (body.jamFrequency !== undefined) updateData.jamFrequency = body.jamFrequency
    if (body.jamGenres !== undefined) updateData.jamGenres = body.jamGenres

    // Operational details
    if (body.operatingHours !== undefined) updateData.operatingHours = body.operatingHours
    if (body.wheelchairAccessible !== undefined)
      updateData.wheelchairAccessible = body.wheelchairAccessible
    if (body.parkingAvailable !== undefined) updateData.parkingAvailable = body.parkingAvailable
    if (body.publicTransportNear !== undefined)
      updateData.publicTransportNear = body.publicTransportNear
    if (body.specialNotes !== undefined) updateData.specialNotes = body.specialNotes

    // Curator fields
    if (body.curatorNotes !== undefined) updateData.curatorNotes = body.curatorNotes
    if (body.curatorRating !== undefined) updateData.curatorRating = body.curatorRating
    if (body.followUpNeeded !== undefined) updateData.followUpNeeded = body.followUpNeeded

    // Verification status (only curators and blog owner can change)
    if (body.verified !== undefined) {
      updateData.verified = body.verified
      if (body.verified === true) {
        // Approved: set verifiedAt, clear rejection fields
        updateData.verifiedAt = new Date()
        updateData.rejectedAt = null
        updateData.rejectedBy = null
        updateData.rejectionReason = null
      } else if (body.verified === false) {
        // Rejected: require rejection reason
        if (!body.rejectionReason) {
          return NextResponse.json(
            {
              error: 'Rejection reason is required when rejecting a venue',
            },
            {
              status: 400,
            }
          )
        }
        // Set rejection fields
        updateData.rejectedAt = new Date()
        updateData.rejectedBy = user.walletAddress
        updateData.rejectionReason = body.rejectionReason
        updateData.verifiedAt = null
      }
    }

    // Social media - combine into socialLinks JSON
    const socialLinks: any = {}
    if (body.facebook !== undefined) socialLinks.facebook = body.facebook
    if (body.instagram !== undefined) socialLinks.instagram = body.instagram
    if (body.twitter !== undefined) socialLinks.twitter = body.twitter
    if (Object.keys(socialLinks).length > 0) {
      updateData.socialLinks = socialLinks
    }

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
    // Require BLOG_OWNER role only
    const authResult = await requireRole(request as any, [UserRole.BLOG_OWNER])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

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
