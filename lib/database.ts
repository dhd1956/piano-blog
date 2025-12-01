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
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
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

    // Create venue
    return prisma.venue.create({
      data: {
        ...data,
        slug,
        tags: data.tags || [],
        amenities: data.amenities || [],
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
          select: { reviews: true },
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
      emailVerified?: boolean
      authProvider?: string
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
          emailVerifiedAt: initialData?.emailVerified ? new Date() : null,
        },
      })
    }

    return user
  },

  /**
   * Find potential account merge candidate
   * Looks for existing user with same email but different wallet address
   */
  async findPotentialMerge(email: string, currentWalletAddress: string) {
    if (!email) return null

    return await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        walletAddress: { not: currentWalletAddress.toLowerCase() },
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
        email: true,
        createdAt: true,
        totalCAVEarned: true,
      },
    })
  },

  /**
   * Merge two user accounts
   * Transfers all data from old account to new wallet address
   */
  async mergeUserAccounts(oldUserId: number, newWalletAddress: string) {
    const normalizedNewAddress = newWalletAddress.toLowerCase()

    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Get old user data
      const oldUser = await tx.user.findUnique({
        where: { id: oldUserId },
        include: {
          musicianProfile: true,
        },
      })

      if (!oldUser) {
        throw new Error('Old user account not found')
      }

      // Find or create new user record
      let newUser = await tx.user.findUnique({
        where: { walletAddress: normalizedNewAddress },
      })

      if (!newUser) {
        // Create new user with old user's data
        newUser = await tx.user.create({
          data: {
            walletAddress: normalizedNewAddress,
            username: oldUser.username,
            displayName: oldUser.displayName,
            email: oldUser.email,
            bio: oldUser.bio,
            avatar: oldUser.avatar,
            location: oldUser.location,
            profileSlug: oldUser.profileSlug,
            title: oldUser.title,
            skills: oldUser.skills,
            socialLinks: oldUser.socialLinks as any,
            ensName: oldUser.ensName,
            totalCAVEarned: oldUser.totalCAVEarned,
            badges: oldUser.badges as any,
            publicProfile: oldUser.publicProfile,
            showPXPBalance: oldUser.showPXPBalance,
            qrCardStyle: oldUser.qrCardStyle as any,
          },
        })
      } else {
        // Update existing new user with merged data
        newUser = await tx.user.update({
          where: { id: newUser.id },
          data: {
            // Preserve username/displayName if new user has them, otherwise use old
            username: newUser.username || oldUser.username,
            displayName: newUser.displayName || oldUser.displayName,
            email: oldUser.email, // Keep email from old account (they matched)
            bio: newUser.bio || oldUser.bio,
            avatar: newUser.avatar || oldUser.avatar,
            location: newUser.location || oldUser.location,
            profileSlug: newUser.profileSlug || oldUser.profileSlug,
            title: newUser.title || oldUser.title,
            skills: newUser.skills?.length ? newUser.skills : oldUser.skills,
            socialLinks: (newUser.socialLinks || oldUser.socialLinks) as any,
            // Merge PXP earnings
            totalCAVEarned: (newUser.totalCAVEarned || 0) + (oldUser.totalCAVEarned || 0),
            // Merge badges (combine arrays, remove duplicates)
            badges: (newUser.badges || oldUser.badges
              ? Array.from(new Set([...(newUser.badges || []), ...(oldUser.badges || [])]))
              : []) as any,
          },
        })
      }

      // Transfer reviews to new user (if review model exists)
      // Note: Currently commented out as Review model may not be in schema
      // if (oldUser.reviews && oldUser.reviews.length > 0) {
      //   await tx.review.updateMany({
      //     where: { userId: oldUserId },
      //     data: { userId: newUser.id },
      //   })
      // }

      // Transfer events to new user
      await tx.event.updateMany({
        where: { organizerId: oldUserId },
        data: { organizerId: newUser.id },
      })

      // Transfer musician profile if exists
      if (oldUser.musicianProfile) {
        // Check if new user already has a musician profile
        const existingProfile = await tx.musicianProfile.findUnique({
          where: { userId: newUser.id },
        })

        if (!existingProfile) {
          // Transfer old profile to new user
          await tx.musicianProfile.update({
            where: { userId: oldUserId },
            data: { userId: newUser.id },
          })
        } else {
          // Merge profile data
          await tx.musicianProfile.update({
            where: { userId: newUser.id },
            data: {
              instruments: Array.from(
                new Set([
                  ...(existingProfile.instruments || []),
                  ...(oldUser.musicianProfile.instruments || []),
                ])
              ),
              musicalStyles: Array.from(
                new Set([
                  ...(existingProfile.musicalStyles || []),
                  ...(oldUser.musicianProfile.musicalStyles || []),
                ])
              ),
              genres: Array.from(
                new Set([
                  ...(existingProfile.genres || []),
                  ...(oldUser.musicianProfile.genres || []),
                ])
              ),
              // Keep most experienced level
              experienceLevel:
                existingProfile.experienceLevel || oldUser.musicianProfile.experienceLevel,
              yearsPlaying: Math.max(
                existingProfile.yearsPlaying || 0,
                oldUser.musicianProfile.yearsPlaying || 0
              ),
              availableForGigs:
                existingProfile.availableForGigs || oldUser.musicianProfile.availableForGigs,
              availableForCollab:
                existingProfile.availableForCollab || oldUser.musicianProfile.availableForCollab,
              availabilityNotes:
                existingProfile.availabilityNotes || oldUser.musicianProfile.availabilityNotes,
              recordingLinks: Array.from(
                new Set([
                  ...(existingProfile.recordingLinks || []),
                  ...(oldUser.musicianProfile.recordingLinks || []),
                ])
              ),
              repertoire: Array.from(
                new Set([
                  ...(existingProfile.repertoire || []),
                  ...(oldUser.musicianProfile.repertoire || []),
                ])
              ),
            },
          })

          // Delete old profile (already merged)
          await tx.musicianProfile.delete({
            where: { userId: oldUserId },
          })
        }
      }

      // Transfer venue submissions (if both users have wallet addresses)
      if (oldUser.walletAddress && newUser.walletAddress) {
        await tx.venue.updateMany({
          where: { submittedBy: { equals: oldUser.walletAddress, mode: 'insensitive' } },
          data: { submittedBy: newUser.walletAddress },
        })
      }

      // Delete old user record
      await tx.user.delete({
        where: { id: oldUserId },
      })

      return newUser
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
