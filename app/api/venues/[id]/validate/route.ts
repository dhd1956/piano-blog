/**
 * Venue Validation API
 * Handles multi-signature validation (3 validators required)
 * Blog owner can instantly verify without validators
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-simplified'
import { requireRole, can } from '@/lib/auth-middleware'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

const validationSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
})

/**
 * POST /api/venues/[id]/validate
 * Submit a validation vote for a venue
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const venueId = parseInt(params.id)

    if (isNaN(venueId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid venue ID',
        },
        { status: 400 }
      )
    }

    // Require VALIDATOR or BLOG_OWNER role
    const authResult = await requireRole(request as any, [UserRole.VALIDATOR, UserRole.BLOG_OWNER])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    // Verify venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        validations: {
          include: {
            validator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                role: true,
              },
            },
          },
        },
      },
    })

    if (!venue) {
      return NextResponse.json(
        {
          success: false,
          error: 'Venue not found',
        },
        { status: 404 }
      )
    }

    // Check if venue is already verified
    if (venue.verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Venue already verified',
          message: 'This venue has already been verified',
        },
        { status: 400 }
      )
    }

    // Parse validation data
    const body = await request.json()
    const validation = validationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { approved, notes, rating } = validation.data

    // Blog owner can instantly verify
    if (can.instantVerifyVenue(user)) {
      if (approved) {
        await prisma.venue.update({
          where: { id: venueId },
          data: {
            verified: true,
            verifiedAt: new Date(),
          },
        })

        // Record the blog owner's validation
        await prisma.venueValidation.create({
          data: {
            venueId,
            validatorId: user.id,
            approved,
            notes: notes || 'Verified by blog owner',
            rating,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Venue instantly verified by blog owner',
          venue: {
            id: venue.id,
            name: venue.name,
            verified: true,
            verifiedAt: new Date(),
          },
        })
      } else {
        // Blog owner rejected
        await prisma.venueValidation.create({
          data: {
            venueId,
            validatorId: user.id,
            approved,
            notes: notes || 'Rejected by blog owner',
            rating,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Venue rejected by blog owner',
          venue: {
            id: venue.id,
            name: venue.name,
            verified: false,
          },
        })
      }
    }

    // Check if this validator has already voted
    const existingValidation = venue.validations.find((v) => v.validatorId === user.id)

    if (existingValidation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already validated',
          message: 'You have already submitted a validation for this venue',
        },
        { status: 400 }
      )
    }

    // Create validation record
    await prisma.venueValidation.create({
      data: {
        venueId,
        validatorId: user.id,
        approved,
        notes,
        rating,
      },
    })

    // Check if we have 3 approvals
    const allValidations = await prisma.venueValidation.findMany({
      where: { venueId },
    })

    const approvalCount = allValidations.filter((v) => v.approved).length

    // Auto-verify if we have 3 approvals
    if (approvalCount >= 3) {
      await prisma.venue.update({
        where: { id: venueId },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Venue automatically verified (3 validators approved)',
        venue: {
          id: venue.id,
          name: venue.name,
          verified: true,
          verifiedAt: new Date(),
        },
        validationCount: {
          total: allValidations.length,
          approved: approvalCount,
          required: 3,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Validation submitted successfully',
      venue: {
        id: venue.id,
        name: venue.name,
        verified: false,
      },
      validationCount: {
        total: allValidations.length,
        approved: approvalCount,
        required: 3,
      },
    })
  } catch (error: any) {
    console.error('Validation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        message: error.message || 'An error occurred during validation',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/venues/[id]/validate
 * Get validation status for a venue
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const venueId = parseInt(params.id)

    if (isNaN(venueId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid venue ID',
        },
        { status: 400 }
      )
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        name: true,
        verified: true,
        verifiedAt: true,
        validations: {
          include: {
            validator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!venue) {
      return NextResponse.json(
        {
          success: false,
          error: 'Venue not found',
        },
        { status: 404 }
      )
    }

    const approvalCount = venue.validations.filter((v) => v.approved).length
    const rejectionCount = venue.validations.filter((v) => !v.approved).length

    return NextResponse.json({
      success: true,
      venue: {
        id: venue.id,
        name: venue.name,
        verified: venue.verified,
        verifiedAt: venue.verifiedAt,
      },
      validationStatus: {
        total: venue.validations.length,
        approved: approvalCount,
        rejected: rejectionCount,
        required: 3,
        needsMore: Math.max(0, 3 - approvalCount),
      },
      validations: venue.validations.map((v) => ({
        id: v.id,
        approved: v.approved,
        notes: v.notes,
        rating: v.rating,
        createdAt: v.createdAt,
        validator: {
          id: v.validator.id,
          username: v.validator.username,
          displayName: v.validator.displayName,
          role: v.validator.role,
        },
      })),
    })
  } catch (error: any) {
    console.error('Get validation status error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get validation status',
        message: error.message || 'An error occurred',
      },
      { status: 500 }
    )
  }
}
