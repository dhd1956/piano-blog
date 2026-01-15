import { NextResponse } from 'next/server'
import { detectEnvironment, getDatabaseIdentifier } from '@/lib/env-config'
import { getDb } from '@/lib/get-db'

/**
 * Database statistics endpoint
 * Shows current database stats to verify isolation
 * Public endpoint - no auth required
 */
export async function GET() {
  try {
    const env = detectEnvironment()
    const dbIdentifier = getDatabaseIdentifier()
    const db = await getDb()

    const stats = {
      environment: env,
      database: dbIdentifier,
      counts: {
        users: await db.user.count(),
        venues: await db.venue.count(),
        verifications: await db.venueVerification.count(),
        reviews: await db.venueReview.count(),
        events: await db.event.count(),
        pxpPayments: await db.pXPPayment.count(),
        appConfigs: await db.appConfig.count(),
      },
      sampleData: {
        firstUser: await db.user.findFirst({
          select: {
            username: true,
            email: true,
            role: true,
            createdAt: true,
          },
        }),
        venueCount: await db.venue.count(),
      },
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch database stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
