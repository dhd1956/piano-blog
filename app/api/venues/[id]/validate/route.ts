/**
 * Venue Validation API
 * Handles multi-signature validation (3 validators required)
 * Blog owner can instantly verify without validators
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { requireRole, can } from '@/lib/auth-middleware'
import { AuthUser } from '@/lib/auth'
import { UserRole, PrismaClient } from '@prisma/client'
import { z } from 'zod'

/**
 * Award PXP rewards when a venue is verified
 * Awards to both the scout (submitter) and the verifier (curator/validator)
 */
async function awardVerificationRewards(
  db: PrismaClient,
  venue: { id: number; name: string; submittedBy: string },
  verifier: AuthUser,
  isInstantVerify: boolean
): Promise<{ scoutReward: number; verifierReward: number }> {
  let scoutReward = 0
  let verifierReward = 0

  // Award PXP to scout (venue submitter)
  try {
    const scoutUser = await db.user.findUnique({
      where: { walletAddress: venue.submittedBy.toLowerCase() },
      select: { id: true, walletAddress: true, username: true, firstPXPEarnedAt: true },
    })

    if (scoutUser) {
      const scoutConfig = await db.pXPConfig.findUnique({
        where: { key: 'venue_verified' },
        select: { value: true, enabled: true },
      })

      scoutReward = scoutConfig && scoutConfig.enabled ? scoutConfig.value : 50

      await db.user.update({
        where: { id: scoutUser.id },
        data: {
          totalPXPEarned: { increment: scoutReward },
          firstPXPEarnedAt: scoutUser.firstPXPEarnedAt || new Date(),
        },
      })

      console.log(
        `✅ Awarded ${scoutReward} PXP to scout ${scoutUser.walletAddress || scoutUser.username} for verified venue "${venue.name}"`
      )
    }
  } catch (error) {
    console.error('Error awarding scout PXP:', error)
  }

  // Award PXP to verifier (curator/blog owner)
  try {
    const verifierConfig = await db.pXPConfig.findUnique({
      where: { key: 'curator_verification' },
      select: { value: true, enabled: true },
    })

    verifierReward = verifierConfig && verifierConfig.enabled ? verifierConfig.value : 20

    const verifierUser = await db.user.findUnique({
      where: { id: verifier.id },
      select: { firstPXPEarnedAt: true },
    })

    await db.user.update({
      where: { id: verifier.id },
      data: {
        totalPXPEarned: { increment: verifierReward },
        firstPXPEarnedAt: verifierUser?.firstPXPEarnedAt || new Date(),
      },
    })

    console.log(
      `✅ Awarded ${verifierReward} PXP to ${isInstantVerify ? 'blog owner' : 'validator'} ${verifier.walletAddress || verifier.username} for verifying venue "${venue.name}"`
    )
  } catch (error) {
    console.error('Error awarding verifier PXP:', error)
  }

  return { scoutReward, verifierReward }
}

const validationSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
})

/**
 * POST /api/venues/[id]/validate
 * Submit a validation vote for a venue
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const venueId = parseInt(id)

    if (isNaN(venueId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid venue ID',
        },
        { status: 400 }
      )
    }

    // Require CURATOR, VALIDATOR, or BLOG_OWNER role
    const authResult = await requireRole(request as any, [
      UserRole.CURATOR,
      UserRole.VALIDATOR,
      UserRole.BLOG_OWNER,
    ])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    const db = await getDb()

    // Verify venue exists
    const venue = await db.venue.findUnique({
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
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { approved, notes, rating } = validation.data

    // Blog owner can instantly verify
    if (can.instantVerifyVenue(user)) {
      if (approved) {
        await db.venue.update({
          where: { id: venueId },
          data: {
            verified: true,
            verifiedAt: new Date(),
          },
        })

        // Record the blog owner's validation
        await db.venueValidation.create({
          data: {
            venueId,
            validatorId: user.id,
            approved,
            notes: notes || 'Verified by blog owner',
            rating,
          },
        })

        // Award PXP to scout and blog owner
        const rewards = await awardVerificationRewards(
          db,
          { id: venue.id, name: venue.name, submittedBy: venue.submittedBy },
          user,
          true
        )

        return NextResponse.json({
          success: true,
          message: 'Venue instantly verified by blog owner',
          venue: {
            id: venue.id,
            name: venue.name,
            verified: true,
            verifiedAt: new Date(),
          },
          pxpAwarded: {
            scout: rewards.scoutReward,
            verifier: rewards.verifierReward,
          },
        })
      } else {
        // Blog owner rejected
        await db.venueValidation.create({
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
    await db.venueValidation.create({
      data: {
        venueId,
        validatorId: user.id,
        approved,
        notes,
        rating,
      },
    })

    // Check if we have 3 approvals
    const allValidations = await db.venueValidation.findMany({
      where: { venueId },
    })

    const approvalCount = allValidations.filter((v) => v.approved).length

    // Auto-verify if we have 3 approvals
    if (approvalCount >= 3) {
      await db.venue.update({
        where: { id: venueId },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      })

      // Award PXP to scout and the validator who triggered verification
      const rewards = await awardVerificationRewards(
        db,
        { id: venue.id, name: venue.name, submittedBy: venue.submittedBy },
        user,
        false
      )

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
        pxpAwarded: {
          scout: rewards.scoutReward,
          verifier: rewards.verifierReward,
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
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const venueId = parseInt(id)

    if (isNaN(venueId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid venue ID',
        },
        { status: 400 }
      )
    }

    const db = await getDb()
    const venue = await db.venue.findUnique({
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
