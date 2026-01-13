/**
 * Seed script for Piano Style Platform database
 * Populates the database with initial data for development
 */

import { PrismaClient } from '@prisma/client'
import { detectEnvironment } from '../lib/env-config'

const prisma = new PrismaClient()

async function main() {
  const env = detectEnvironment()
  console.log(`🌱 Seeding ${env} environment...`)

  if (env === 'development' || env === 'staging') {
    // DEVELOPMENT/STAGING: Lots of test data
    await seedDevelopmentData()
  } else if (env === 'production') {
    // PRODUCTION: Minimal essential data
    await seedProductionData()
  }

  console.log('✨ Database seeded successfully!')
  console.log('📈 Summary:')
  console.log(`- Created ${await prisma.user.count()} users`)
  console.log(`- Created ${await prisma.venue.count()} venues`)
  console.log(`- Created ${await prisma.venueVerification.count()} verifications`)
  console.log(`- Created ${await prisma.venueReview.count()} reviews`)
  console.log(`- Created ${await prisma.pXPPayment.count()} PXP payments`)
  console.log(`- Created ${await prisma.venueAnalytics.count()} analytics records`)
  console.log(`- Created ${await prisma.appConfig.count()} app configurations`)
}

/**
 * Seed development/staging environment with test data
 */
async function seedDevelopmentData() {
  console.log('📚 Loading comprehensive test data for development/staging...')

  // Create test users
  console.log('👥 Creating test users...')

  const user1 = await prisma.user.upsert({
    where: { walletAddress: '0x742d35cc6634c0532925a3b8d0d35c5d35f65b8f' },
    update: {},
    create: {
      walletAddress: '0x742d35cc6634c0532925a3b8d0d35c5d35f65b8f',
      username: 'pianoexplorer',
      displayName: 'Piano Explorer',
      email: 'explorer@pianos.com',
      bio: 'Passionate piano venue scout and Web3 enthusiast',
      totalCAVEarned: 150.0,
      hasClaimedNewUserReward: true,
      isAuthorizedVerifier: false,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { walletAddress: '0x8ba1f109551bd432803012645hac136c13d248b9' },
    update: {},
    create: {
      walletAddress: '0x8ba1f109551bd432803012645hac136c13d248b9',
      username: 'jazzlover',
      displayName: 'Jazz Lover',
      email: 'jazz@music.com',
      bio: 'Jazz pianist and venue curator',
      totalCAVEarned: 275.0,
      hasClaimedNewUserReward: true,
      isAuthorizedVerifier: true,
    },
  })

  console.log(`Created users: ${user1.username}, ${user2.username}`)

  // Create test venues
  console.log('🏢 Creating test venues...')

  const venue1 = await prisma.venue.upsert({
    where: { slug: 'piano-paradise-cafe' },
    update: {},
    create: {
      name: 'Piano Paradise Café',
      slug: 'piano-paradise-cafe',
      city: 'San Francisco',
      contactInfo: 'contact@pianoparadise.com',
      contactType: 'email',
      submittedBy: user1.walletAddress!,
      hasPiano: true,
      hasJamSession: false,
      verified: true,
      verifiedAt: new Date(),
      venueHash: '0xhash1234567890abcdef',
      description:
        'A cozy café with a beautiful grand piano and live performances every evening. Perfect spot for piano enthusiasts and coffee lovers alike.',
      address: '123 Music Street, San Francisco, CA 94102',
      latitude: 37.7749,
      longitude: -122.4194,
      phone: '(415) 555-0123',
      website: 'https://pianoparadise.com',
      socialLinks: {
        instagram: '@pianoparadise',
        facebook: 'PianoParadiseCafe',
      },
      amenities: ['WiFi', 'Live Music', 'Coffee', 'Pastries', 'Piano Rental'],
      tags: ['piano', 'coffee', 'live music', 'cozy', 'grand piano'],
      priceRange: '$$',
      rating: 4.8,
      reviewCount: 127,
    },
  })

  const venue2 = await prisma.venue.upsert({
    where: { slug: 'melody-lounge' },
    update: {},
    create: {
      name: 'Melody Lounge',
      slug: 'melody-lounge',
      city: 'New York',
      contactInfo: 'info@melodylounge.com',
      contactType: 'email',
      submittedBy: user2.walletAddress!,
      hasPiano: true,
      hasJamSession: true,
      verified: true,
      verifiedAt: new Date(),
      venueHash: '0xhash2345678901bcdefg',
      description:
        'Upscale lounge featuring jazz piano and weekly jam sessions. A sophisticated venue for serious musicians and jazz enthusiasts.',
      address: '456 Jazz Avenue, New York, NY 10001',
      latitude: 40.7128,
      longitude: -74.006,
      phone: '(212) 555-0456',
      website: 'https://melodylounge.com',
      socialLinks: {
        instagram: '@melodylounge',
        twitter: 'MelodyLoungeNYC',
      },
      amenities: ['Bar', 'Live Music', 'Jazz', 'Cocktails', 'Private Events'],
      tags: ['piano', 'jazz', 'cocktails', 'jam session', 'upscale'],
      priceRange: '$$$',
      rating: 4.6,
      reviewCount: 89,
    },
  })

  const venue3 = await prisma.venue.upsert({
    where: { slug: 'austin-community-center' },
    update: {},
    create: {
      name: 'Austin Community Center',
      slug: 'austin-community-center',
      city: 'Austin',
      contactInfo: 'admin@austincc.org',
      contactType: 'email',
      submittedBy: user1.walletAddress!,
      hasPiano: true,
      hasJamSession: false,
      verified: false,
      description:
        'Community center with an upright piano available for public use. Great for practice sessions and community events.',
      address: '789 Community Drive, Austin, TX 78701',
      latitude: 30.2672,
      longitude: -97.7431,
      phone: '(512) 555-0789',
      website: 'https://austincc.org',
      amenities: ['Public Access', 'Events', 'Classes', 'Meeting Rooms'],
      tags: ['community', 'piano', 'public', 'events', 'practice'],
      priceRange: '$',
      rating: 4.2,
      reviewCount: 34,
    },
  })

  const venue4 = await prisma.venue.upsert({
    where: { slug: 'the-keys-restaurant' },
    update: {},
    create: {
      name: 'The Keys Restaurant',
      slug: 'the-keys-restaurant',
      city: 'Chicago',
      contactInfo: '(312) 555-0987',
      contactType: 'phone',
      submittedBy: user2.walletAddress!,
      hasPiano: true,
      hasJamSession: true,
      verified: true,
      verifiedAt: new Date(),
      venueHash: '0xhash3456789012cdefgh',
      description:
        'Fine dining restaurant with live piano entertainment and monthly jam sessions for local musicians.',
      address: '321 Harmony Street, Chicago, IL 60601',
      latitude: 41.8781,
      longitude: -87.6298,
      phone: '(312) 555-0987',
      website: 'https://thekeysrestaurant.com',
      socialLinks: {
        instagram: '@thekeysrestaurant',
      },
      amenities: ['Fine Dining', 'Live Music', 'Piano Bar', 'Private Dining', 'Valet'],
      tags: ['restaurant', 'piano', 'fine dining', 'jam session', 'elegant'],
      priceRange: '$$$$',
      rating: 4.9,
      reviewCount: 203,
    },
  })

  console.log(`Created venues: ${venue1.name}, ${venue2.name}, ${venue3.name}, ${venue4.name}`)

  // Create venue verifications
  console.log('✅ Creating venue verifications...')

  await prisma.venueVerification.createMany({
    data: [
      {
        venueId: venue1.id,
        verifierAddress: user2.walletAddress!,
        approved: true,
        notes:
          'Excellent venue with high-quality grand piano. Staff is very accommodating to musicians.',
        rating: 5,
        transactionHash: '0xabc123def456',
        blockNumber: 12345678,
      },
      {
        venueId: venue2.id,
        verifierAddress: user1.walletAddress!,
        approved: true,
        notes:
          'Great atmosphere for jazz. Piano is well-maintained. Jam sessions are well-organized.',
        rating: 4,
        transactionHash: '0xdef456ghi789',
        blockNumber: 12345679,
      },
      {
        venueId: venue4.id,
        verifierAddress: user1.walletAddress!,
        approved: true,
        notes: 'Upscale restaurant with beautiful piano. Perfect for special occasions.',
        rating: 5,
        transactionHash: '0xghi789jkl012',
        blockNumber: 12345680,
      },
    ],
  })

  // Create sample reviews
  console.log('⭐ Creating venue reviews...')

  await prisma.venueReview.createMany({
    data: [
      {
        venueId: venue1.id,
        userId: user2.id,
        rating: 5,
        title: 'Perfect piano café experience',
        content:
          'Love coming here for the atmosphere and the piano. The staff lets you play during quiet hours, and the coffee is excellent too.',
        pianoQuality: 5,
        isVerified: true,
      },
      {
        venueId: venue2.id,
        userId: user1.id,
        rating: 4,
        title: 'Great jazz venue',
        content:
          'The jam sessions here are fantastic. Piano is in good condition and the sound system is professional grade.',
        pianoQuality: 4,
        isVerified: true,
      },
      {
        venueId: venue4.id,
        userId: user1.id,
        rating: 5,
        title: 'Elegant dining with beautiful piano music',
        content:
          'Exceptional restaurant with live piano entertainment. The pianist is very skilled and takes requests.',
        pianoQuality: 5,
        isVerified: true,
      },
    ],
  })

  // Create sample PXP payments
  console.log('💰 Creating PXP payment records...')

  await prisma.pXPPayment.createMany({
    data: [
      {
        venueId: venue1.id,
        amount: 25.0,
        fromAddress: user2.walletAddress!,
        toAddress: user1.walletAddress!, // venue owner
        transactionHash: '0xpayment123abc',
        blockNumber: 12345681,
        blockTimestamp: new Date('2024-01-15T14:30:00Z'),
        status: 'CONFIRMED',
        paymentType: 'venue_payment',
        memo: 'Coffee and piano time',
        paymentMethod: 'web3',
      },
      {
        venueId: venue2.id,
        amount: 15.0,
        fromAddress: user1.walletAddress!,
        toAddress: user2.walletAddress!, // venue owner
        transactionHash: '0xpayment456def',
        blockNumber: 12345682,
        blockTimestamp: new Date('2024-01-16T19:45:00Z'),
        status: 'CONFIRMED',
        paymentType: 'venue_payment',
        memo: 'Tip for great jazz performance',
        paymentMethod: 'qr',
      },
    ],
  })

  // Create analytics data
  console.log('📊 Creating analytics data...')

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)

  await prisma.venueAnalytics.createMany({
    data: [
      {
        venueId: venue1.id,
        date: today,
        views: 45,
        uniqueViews: 32,
        qrScans: 8,
        detailViews: 15,
        shareClicks: 3,
        searchImpressions: 78,
        searchClicks: 12,
      },
      {
        venueId: venue1.id,
        date: yesterday,
        views: 38,
        uniqueViews: 28,
        qrScans: 6,
        detailViews: 12,
        shareClicks: 2,
        searchImpressions: 65,
        searchClicks: 9,
      },
      {
        venueId: venue2.id,
        date: today,
        views: 52,
        uniqueViews: 41,
        qrScans: 12,
        detailViews: 18,
        shareClicks: 5,
        searchImpressions: 89,
        searchClicks: 18,
      },
    ],
  })

  // Create app configuration
  console.log('⚙️ Creating app configuration...')

  await prisma.appConfig.upsert({
    where: { key: 'cav_rewards' },
    update: {
      value: {
        newUser: 25,
        venueScout: 50,
        verifier: 25,
        minVerifications: 2,
        maxVerifications: 3,
      },
    },
    create: {
      key: 'cav_rewards',
      value: {
        newUser: 25,
        venueScout: 50,
        verifier: 25,
        minVerifications: 2,
        maxVerifications: 3,
      },
      description: 'PXP reward amounts and verification requirements',
    },
  })

  await prisma.appConfig.upsert({
    where: { key: 'featured_venues' },
    update: {
      value: {
        venueIds: [venue1.id, venue2.id, venue4.id],
      },
    },
    create: {
      key: 'featured_venues',
      value: {
        venueIds: [venue1.id, venue2.id, venue4.id],
      },
      description: 'List of featured venue IDs for homepage',
    },
  })

  console.log('✅ Development/staging data seeded!')
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

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
