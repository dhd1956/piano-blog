/**
 * Restore Soft-Deleted Venue API
 * Blog owner can restore a soft-deleted venue
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-middleware'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/database'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require BLOG_OWNER role
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

    // Get venue (including deleted ones)
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
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

    // Check if venue is actually deleted
    if (venue.isActive) {
      return NextResponse.json(
        {
          error: 'Venue is not deleted',
        },
        {
          status: 400,
        }
      )
    }

    // Restore venue
    const restoredVenue = await prisma.venue.update({
      where: { id: venueId },
      data: {
        isActive: true,
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Venue restored successfully',
      venue: {
        id: restoredVenue.id,
        name: restoredVenue.name,
        isActive: restoredVenue.isActive,
      },
    })
  } catch (error: any) {
    console.error('Venue restore error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to restore venue',
        message: error.message,
      },
      {
        status: 500,
      }
    )
  }
}
