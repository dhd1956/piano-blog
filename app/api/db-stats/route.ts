import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { detectEnvironment, getDatabaseIdentifier } from '@/lib/env-config'

const prisma = new PrismaClient()

/**
 * Database statistics endpoint
 * Shows current database stats to verify isolation
 * Public endpoint - no auth required
 */
export async function GET() {
  try {
    const env = detectEnvironment()
    const dbIdentifier = getDatabaseIdentifier()

    const stats = {
      environment: env,
      database: dbIdentifier,
      counts: {
        users: await prisma.user.count(),
        venues: await prisma.venue.count(),
        verifications: await prisma.venueVerification.count(),
        reviews: await prisma.venueReview.count(),
        events: await prisma.event.count(),
        pxpPayments: await prisma.pXPPayment.count(),
        appConfigs: await prisma.appConfig.count(),
      },
      sampleData: {
        firstUser: await prisma.user.findFirst({
          select: {
            username: true,
            email: true,
            role: true,
            createdAt: true,
          },
        }),
        venueCount: await prisma.venue.count(),
      },
    }

    await prisma.$disconnect()

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    await prisma.$disconnect()
    return NextResponse.json(
      {
        error: 'Failed to fetch database stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
