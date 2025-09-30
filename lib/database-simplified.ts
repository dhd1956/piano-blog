/**
 * Simplified Database Service - PostgreSQL only for content
 * No complex blockchain sync, just simple references to transaction hashes
 */

import { PrismaClient } from '@prisma/client'
import { CAVRewardsService } from '@/utils/rewards-contract'

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Simplified Venue Service
 */
export const VenueService = {
  /**
   * Get all venues with filtering (PostgreSQL-only, no blockchain sync)
   */
  async getVenues(
    options: {
      city?: string
      hasPiano?: boolean
      verified?: boolean
      search?: string
      limit?: number
      offset?: number
      orderBy?: 'name' | 'rating' | 'createdAt'
      orderDirection?: 'asc' | 'desc'
    } = {}
  ) {
    const {
      city,
      hasPiano,
      verified,
      search,
      limit = 50,
      offset = 0,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    } = options

    const where: any = {}

    // Build filters
    if (city && city !== 'all') where.city = { contains: city, mode: 'insensitive' }
    if (typeof hasPiano === 'boolean') where.hasPiano = hasPiano
    if (typeof verified === 'boolean') where.verified = verified

    // Full-text search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ]
    }

    // Execute query
    const venues = await prisma.venue.findMany({
      where,
      include: {
        reviews: {
          include: {
            user: {
              select: { displayName: true, username: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Latest 5 reviews
        },
        verifications: {
          orderBy: { timestamp: 'desc' },
          take: 3, // Latest 3 verifications
        },
        analytics: {
          where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
      orderBy: { [orderBy]: orderDirection },
      take: limit,
      skip: offset,
    })

    const totalCount = await prisma.venue.count({ where })

    return {
      venues,
      totalCount,
      hasMore: offset + limit < totalCount,
    }
  },

  /**
   * Get single venue by ID or slug
   */
  async getVenue(identifier: string | number) {
    const where =
      typeof identifier === 'number'
        ? { id: identifier }
        : isNaN(Number(identifier))
          ? { slug: identifier }
          : { id: Number(identifier) }

    return prisma.venue.findUnique({
      where,
      include: {
        reviews: {
          include: {
            user: {
              select: { displayName: true, username: true, avatar: true, walletAddress: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        verifications: {
          orderBy: { timestamp: 'desc' },
        },
        analytics: {
          where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          orderBy: { date: 'desc' },
        },
      },
    })
  },

  /**
   * Create venue (PostgreSQL-only, immediate)
   */
  async createVenue(data: {
    name: string
    city: string
    contactInfo: string
    contactType?: string
    submittedBy: string
    hasPiano?: boolean
    hasJamSession?: boolean
    description?: string
    address?: string
    phone?: string
    website?: string
    amenities?: string[]
    tags?: string[]
  }) {
    // Generate slug
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    let slug = baseSlug
    let counter = 1
    while (await prisma.venue.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Generate venue hash for potential blockchain verification
    const cavService = new CAVRewardsService()
    let venueHash: string | undefined
    try {
      venueHash = await cavService.generateVenueHash(data.name, data.city, data.submittedBy)
    } catch (error) {
      console.warn('Could not generate venue hash:', error)
    }

    // Create venue immediately in PostgreSQL
    return prisma.venue.create({
      data: {
        ...data,
        slug,
        venueHash,
        tags: data.tags || [],
        amenities: data.amenities || [],
      },
    })
  },

  /**
   * Update venue verification status (called when blockchain event is detected)
   */
  async markVenueAsVerified(venueHash: string, transactionHash: string) {
    return prisma.venue.updateMany({
      where: { venueHash },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    })
  },

  /**
   * Get venues by city
   */
  async getVenuesByCity(city: string, options: { hasPiano?: boolean; verified?: boolean } = {}) {
    const where: any = {
      city: { contains: city, mode: 'insensitive' },
    }

    if (typeof options.hasPiano === 'boolean') where.hasPiano = options.hasPiano
    if (typeof options.verified === 'boolean') where.verified = options.verified

    return prisma.venue.findMany({
      where,
      include: {
        reviews: { take: 3, orderBy: { createdAt: 'desc' } },
      },
      orderBy: [{ verified: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
    })
  },
}

/**
 * Simplified User Service
 */
export const UserService = {
  /**
   * Find or create user by wallet address
   */
  async findOrCreateUser(
    walletAddress: string,
    initialData?: {
      username?: string
      displayName?: string
      email?: string
    }
  ) {
    const normalizedAddress = walletAddress.toLowerCase()

    let user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    })

    if (!user) {
      // Check blockchain for user status when creating
      const cavService = new CAVRewardsService()
      let hasClaimedNewUserReward = false
      let isAuthorizedVerifier = false

      try {
        hasClaimedNewUserReward = await cavService.hasClaimedNewUserReward(normalizedAddress)
        isAuthorizedVerifier = await cavService.isAuthorizedVerifier(normalizedAddress)
      } catch (error) {
        console.warn('Could not fetch user blockchain status:', error)
      }

      user = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          hasClaimedNewUserReward,
          isAuthorizedVerifier,
          ...initialData,
        },
      })
    }

    return user
  },

  /**
   * Update user blockchain-related cache
   */
  async updateUserBlockchainCache(
    walletAddress: string,
    updates: {
      hasClaimedNewUserReward?: boolean
      isAuthorizedVerifier?: boolean
      totalCAVEarned?: number
    }
  ) {
    return prisma.user.update({
      where: { walletAddress: walletAddress.toLowerCase() },
      data: {
        ...updates,
        lastActive: new Date(),
      },
    })
  },
}

/**
 * Analytics Service (PostgreSQL-only)
 */
export const AnalyticsService = {
  /**
   * Track venue view
   */
  async trackVenueView(venueId: number, isUnique: boolean = false) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.venueAnalytics.upsert({
      where: {
        venueId_date: { venueId, date: today },
      },
      update: {
        views: { increment: 1 },
        ...(isUnique && { uniqueViews: { increment: 1 } }),
      },
      create: {
        venueId,
        date: today,
        views: 1,
        uniqueViews: isUnique ? 1 : 0,
      },
    })
  },

  /**
   * Track QR code scan
   */
  async trackQRScan(venueId: number) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.venueAnalytics.upsert({
      where: {
        venueId_date: { venueId, date: today },
      },
      update: {
        qrScans: { increment: 1 },
      },
      create: {
        venueId,
        date: today,
        qrScans: 1,
      },
    })
  },

  /**
   * Track venue detail view
   */
  async trackVenueDetailView(venueId: number) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.venueAnalytics.upsert({
      where: {
        venueId_date: { venueId, date: today },
      },
      update: {
        detailViews: { increment: 1 },
      },
      create: {
        venueId,
        date: today,
        detailViews: 1,
      },
    })
  },
}

/**
 * Blockchain Event Service (for tracking important blockchain events)
 */
export const BlockchainEventService = {
  /**
   * Record blockchain event
   */
  async recordEvent(eventData: {
    eventType: string
    contractAddress: string
    transactionHash: string
    blockNumber: number
    blockTimestamp: Date
    eventData: any
  }) {
    return prisma.blockchainEvent.create({
      data: eventData,
    })
  },

  /**
   * Process pending blockchain events
   */
  async processPendingEvents() {
    const pendingEvents = await prisma.blockchainEvent.findMany({
      where: { processed: false },
      orderBy: { blockNumber: 'asc' },
      take: 10, // Process in batches
    })

    for (const event of pendingEvents) {
      try {
        await this.processEvent(event)
        await prisma.blockchainEvent.update({
          where: { id: event.id },
          data: { processed: true, processedAt: new Date() },
        })
      } catch (error) {
        console.error(`Failed to process event ${event.id}:`, error)
      }
    }
  },

  /**
   * Process individual blockchain event
   */
  async processEvent(event: any) {
    switch (event.eventType) {
      case 'VenueVerified':
        // Update venue verification status
        if (event.eventData.approved && event.eventData.venueHash) {
          await VenueService.markVenueAsVerified(event.eventData.venueHash, event.transactionHash)
        }
        break

      case 'NewUserRewarded':
        // Update user cache
        if (event.eventData.user) {
          await UserService.updateUserBlockchainCache(event.eventData.user, {
            hasClaimedNewUserReward: true,
            totalCAVEarned: event.eventData.amount / 1e18, // Convert from wei
          })
        }
        break

      case 'ScoutRewarded':
        // Update scout's total earnings
        if (event.eventData.scout && event.eventData.amount) {
          const currentUser = await UserService.findOrCreateUser(event.eventData.scout)
          await UserService.updateUserBlockchainCache(event.eventData.scout, {
            totalCAVEarned: currentUser.totalCAVEarned + event.eventData.amount / 1e18,
          })
        }
        break

      case 'PaymentTracked':
        // Record CAV payment
        await prisma.cAVPayment.create({
          data: {
            fromAddress: event.eventData.from,
            toAddress: event.eventData.to,
            amount: event.eventData.amount / 1e18, // Convert from wei
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            blockTimestamp: event.blockTimestamp,
            paymentType: 'direct_transfer',
            memo: event.eventData.memo || '',
            paymentMethod: 'web3',
            status: 'CONFIRMED',
          },
        })
        break
    }
  },
}

// Generate test data for simplified schema
export const generateSimplifiedTestData = async () => {
  console.log('Generating simplified test venue data...')

  const testVenues = [
    {
      name: 'Piano Paradise Café',
      city: 'San Francisco',
      contactInfo: 'contact@pianoparadise.com',
      submittedBy: '0x742d35cc6634c0532925a3b8d0d35c5d35f65b8f',
      hasPiano: true,
      description: 'A cozy café with a beautiful grand piano and live performances every evening.',
      address: '123 Music Street, San Francisco, CA',
      phone: '(415) 555-0123',
      amenities: ['WiFi', 'Live Music', 'Coffee', 'Pastries'],
      tags: ['piano', 'coffee', 'live music', 'cozy'],
      verified: true,
      rating: 4.8,
    },
    {
      name: 'Melody Lounge',
      city: 'New York',
      contactInfo: 'info@melodylounge.com',
      submittedBy: '0x8ba1f109551bd432803012645hac136c13d248b9',
      hasPiano: true,
      hasJamSession: true,
      description: 'Upscale lounge featuring jazz piano and weekly jam sessions.',
      address: '456 Jazz Avenue, NYC, NY',
      phone: '(212) 555-0456',
      amenities: ['Bar', 'Live Music', 'Jazz', 'Cocktails'],
      tags: ['piano', 'jazz', 'cocktails', 'jam session'],
      verified: true,
      rating: 4.6,
    },
    {
      name: 'Community Center',
      city: 'Austin',
      contactInfo: 'admin@austincc.org',
      submittedBy: '0x1230456789abcdef1234567890abcdef12345678',
      hasPiano: true,
      description: 'Community center with an upright piano available for public use.',
      address: '789 Community Drive, Austin, TX',
      phone: '(512) 555-0789',
      amenities: ['Public Access', 'Events', 'Classes'],
      tags: ['community', 'piano', 'public', 'events'],
      verified: false,
      rating: 4.2,
    },
  ]

  for (const venue of testVenues) {
    await VenueService.createVenue(venue)
  }

  console.log(`Created ${testVenues.length} test venues (PostgreSQL-only)`)
}

export default prisma
