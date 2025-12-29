/**
 * Venues API Route
 * Handles venue data from PostgreSQL only - simplified architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { VenueService } from '@/lib/database-simplified'
import { getSessionUser } from '@/lib/auth-middleware'
import prisma from '@/lib/prisma'

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
      contactInfo: body.contactInfo,
      contactType: body.contactType || 'email',
      submittedBy: body.submittedBy.toLowerCase(),
      hasPiano: body.hasPiano || false,
      hasJamSession: body.hasJamSession || false,
      venueType: body.venueType ?? 0,
      description: body.description,
      address: body.address || body.fullAddress, // Support both field names
      phone: body.phone,
      website: body.website,
      amenities: body.amenities || [],
      tags: body.tags || [],
    })

    // Award PXP for venue submission
    const sessionUser = await getSessionUser()
    let showFirstPXPToast = false
    let pxpEarned = 0

    if (sessionUser?.id) {
      try {
        // Get user's current PXP status
        const user = await prisma.user.findUnique({
          where: { id: sessionUser.id },
          select: {
            id: true,
            totalCAVEarned: true,
            firstPXPEarnedAt: true,
          },
        })

        if (user) {
          // Check if this is the user's first PXP
          const isFirstPXP = !user.firstPXPEarnedAt && user.totalCAVEarned === 0

          // Award 50 PXP for venue submission
          pxpEarned = 50
          await prisma.user.update({
            where: { id: user.id },
            data: {
              totalCAVEarned: { increment: pxpEarned },
              firstPXPEarnedAt: isFirstPXP ? new Date() : undefined,
            },
          })

          // Set flag to show celebration toast
          showFirstPXPToast = isFirstPXP

          console.log(
            `✅ Awarded ${pxpEarned} PXP to user ${user.id} for venue submission${isFirstPXP ? ' (FIRST PXP!)' : ''}`
          )
        }
      } catch (pxpError) {
        // Don't fail the venue submission if PXP awarding fails
        console.error('Error awarding PXP:', pxpError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        venue,
        message: 'Venue submitted successfully! It will be reviewed by our curators.',
        pxpEarned,
        showFirstPXPToast,
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
