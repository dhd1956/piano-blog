/**
 * Database utility for Piano Style Platform
 * Handles Prisma client initialization and common database operations
 */

import { PrismaClient } from '@prisma/client'

// Global Prisma client instance to prevent multiple connections in development
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
 * Venue service functions
 */
export const VenueService = {
  /**
   * Get all venues with filtering and pagination
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
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (typeof hasPiano === 'boolean') where.hasPiano = hasPiano
    if (typeof verified === 'boolean') where.verified = verified

    // Full-text search across name, description, city, and tags
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ]
    }

    // Execute query with relations
    const venues = await prisma.venue.findMany({
      where,
      include: {
        verifications: {
          orderBy: { timestamp: 'desc' },
          take: 3, // Latest 3 verifications
        },
        analytics: {
          where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // Last 30 days
          orderBy: { date: 'desc' },
          take: 30,
        },
        _count: {
          select: {
            reviews: true,
            payments: true,
          },
        },
      },
      orderBy: { [orderBy]: orderDirection },
      take: limit,
      skip: offset,
    })

    // Get total count for pagination
    const totalCount = await prisma.venue.count({ where })

    return {
      venues,
      totalCount,
      hasMore: offset + limit < totalCount,
    }
  },

  /**
   * Get a single venue by ID or slug
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
        verifications: {
          orderBy: { timestamp: 'desc' },
        },
        reviews: {
          include: {
            user: {
              select: { displayName: true, username: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          where: { status: 'CONFIRMED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        analytics: {
          where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          orderBy: { date: 'desc' },
        },
      },
    })
  },

  /**
   * Create a new venue
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
    paymentAddress?: string
  }) {
    // Generate slug from name
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // Ensure unique slug
    let slug = baseSlug
    let counter = 1
    while (await prisma.venue.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create venue with PENDING sync status
    return prisma.venue.create({
      data: {
        ...data,
        slug,
        syncStatus: 'PENDING',
        tags: data.tags || [],
        amenities: data.amenities || [],
      },
    })
  },

  /**
   * Update venue sync status after blockchain operation
   */
  async updateVenueSync(localId: number, blockchainId: number, transactionHash: string) {
    return prisma.venue.update({
      where: { id: localId },
      data: {
        blockchainId,
        syncStatus: 'COMPLETED',
        lastSynced: new Date(),
      },
    })
  },

  /**
   * Get venues by city for geographic filtering
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
        _count: {
          select: { reviews: true, payments: true },
        },
      },
      orderBy: [
        { verified: 'desc' }, // Verified venues first
        { rating: 'desc' }, // Then by rating
        { createdAt: 'desc' }, // Then by creation date
      ],
    })
  },
}

/**
 * User service functions
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
    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    })

    // Create user if not found
    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: walletAddress.toLowerCase(),
          ...initialData,
        },
      })
    }

    return user
  },

  /**
   * Update user CAV balance (cached value)
   */
  async updateCAVBalance(walletAddress: string, balance: number) {
    return prisma.user.update({
      where: { walletAddress: walletAddress.toLowerCase() },
      data: {
        cavBalance: balance,
        lastActive: new Date(),
      },
    })
  },
}

/**
 * Analytics service functions
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
}

/**
 * Sync queue management
 */
export const SyncService = {
  /**
   * Add operation to sync queue
   */
  async addToQueue(operation: {
    operation: string
    entityType: string
    entityId?: number
    blockchainId?: number
    payload: any
  }) {
    return prisma.syncQueue.create({
      data: operation,
    })
  },

  /**
   * Get pending sync operations
   */
  async getPendingOperations(limit: number = 10) {
    return prisma.syncQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
  },

  /**
   * Update sync operation status
   */
  async updateSyncStatus(
    id: number,
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
    error?: string
  ) {
    return prisma.syncQueue.update({
      where: { id },
      data: {
        status,
        ...(error && { lastError: error }),
        ...(status === 'COMPLETED' && { processedAt: new Date() }),
      },
    })
  },
}

// Utility function to generate test data
export const generateTestData = async () => {
  console.log('Generating test venue data...')

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
      submittedBy: '0x8ba1f109551bD432803012645Hac136c13d248b9',
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

  console.log(`Created ${testVenues.length} test venues`)
}

export default prisma
