import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { detectEnvironment } from '@/lib/env-config'

const prisma = new PrismaClient()

/**
 * API route for seeding the database
 * Requires ADMIN_API_KEY for authentication
 *
 * Usage:
 * curl -X POST https://globalpiano.network/api/seed \
 *   -H "x-admin-api-key: YOUR_ADMIN_API_KEY"
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin API key
    const apiKey = request.headers.get('x-admin-api-key')
    const expectedApiKey = process.env.ADMIN_API_KEY

    if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing API key' },
        { status: 401 }
      )
    }

    const env = detectEnvironment()
    console.log(`🌱 Seeding ${env} environment via API...`)

    // Prevent accidental seeding of wrong environment
    if (env !== 'production') {
      return NextResponse.json(
        {
          error: 'This endpoint is only for production seeding',
          currentEnvironment: env,
          hint: 'Use local seed script for dev/staging',
        },
        { status: 400 }
      )
    }

    // Check if already seeded
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return NextResponse.json(
        {
          message: 'Database already seeded',
          stats: {
            users: existingUsers,
            venues: await prisma.venue.count(),
            verifications: await prisma.venueVerification.count(),
          },
        },
        { status: 200 }
      )
    }

    // Seed production data
    await seedProductionData()

    // Get final counts
    const stats = {
      users: await prisma.user.count(),
      venues: await prisma.venue.count(),
      verifications: await prisma.venueVerification.count(),
      reviews: await prisma.venueReview.count(),
      pxpPayments: await prisma.pXPPayment.count(),
      analytics: await prisma.venueAnalytics.count(),
      appConfigs: await prisma.appConfig.count(),
    }

    console.log('✨ Database seeded successfully via API!')

    return NextResponse.json(
      {
        success: true,
        message: 'Production database seeded successfully',
        environment: env,
        stats,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Seed failed:', error)
    return NextResponse.json(
      {
        error: 'Seed operation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Seed production environment with minimal essential data
 */
async function seedProductionData() {
  console.log('🏭 Loading minimal production data...')

  // Create blog owner/admin account
  console.log('👤 Creating admin account...')

  const blogOwnerWallet =
    process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS || '0xe8985aedf83e2a58fef53b45db2d9556cd5f453a'

  const adminUser = await prisma.user.upsert({
    where: { walletAddress: blogOwnerWallet.toLowerCase() },
    update: {},
    create: {
      walletAddress: blogOwnerWallet.toLowerCase(),
      username: 'admin',
      displayName: 'Piano Blog Admin',
      email: 'admin@globalpiano.network',
      bio: 'Platform administrator and community manager',
      role: 'BLOG_OWNER',
      totalCAVEarned: 0,
      hasClaimedNewUserReward: false,
      isAuthorizedVerifier: true,
      publicProfile: true,
      showPXPBalance: false,
    },
  })

  console.log(`Created admin user: ${adminUser.username}`)

  // Create app configuration
  console.log('⚙️ Creating app configuration...')

  await prisma.appConfig.upsert({
    where: { key: 'cav_rewards' },
    update: {
      value: {
        newUser: 25,
        venueScout: 50,
        verifier: 20,
        minVerifications: 2,
        maxVerifications: 3,
      },
    },
    create: {
      key: 'cav_rewards',
      value: {
        newUser: 25,
        venueScout: 50,
        verifier: 20,
        minVerifications: 2,
        maxVerifications: 3,
      },
      description: 'PXP reward amounts and verification requirements',
    },
  })

  console.log('✅ Production seed complete!')
}

// Also allow GET requests for easier testing (still requires API key)
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-admin-api-key')
  const expectedApiKey = process.env.ADMIN_API_KEY

  if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or missing API key' },
      { status: 401 }
    )
  }

  const env = detectEnvironment()

  const stats = {
    environment: env,
    users: await prisma.user.count(),
    venues: await prisma.venue.count(),
    verifications: await prisma.venueVerification.count(),
    reviews: await prisma.venueReview.count(),
    pxpPayments: await prisma.pXPPayment.count(),
    analytics: await prisma.venueAnalytics.count(),
    appConfigs: await prisma.appConfig.count(),
  }

  await prisma.$disconnect()

  return NextResponse.json({
    message: 'Database status',
    stats,
  })
}
