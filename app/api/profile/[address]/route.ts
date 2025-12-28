import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { UserService } from '@/lib/database'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    // Get optional email and verification status from query parameters (for OAuth auto-capture)
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const emailVerified = searchParams.get('emailVerified') === 'true'
    const authProvider = searchParams.get('authProvider')

    // Normalize address to lowercase for case-insensitive search
    const normalizedAddress = address.toLowerCase()

    // Try to find user by wallet address or profile slug
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { walletAddress: { equals: address, mode: 'insensitive' } },
          { profileSlug: { equals: address, mode: 'insensitive' } },
          { username: { equals: address, mode: 'insensitive' } },
        ],
      },
      include: {
        reviews: {
          select: {
            id: true,
            venueId: true,
            rating: true,
            createdAt: true,
          },
        },
        musicianProfile: true, // Include musician profile data
      },
    })

    // If no user found and address looks like a wallet address (starts with 0x), create user
    if (!user && address.toLowerCase().startsWith('0x')) {
      await UserService.findOrCreateUser(address, {
        email: email || undefined, // Auto-capture email from OAuth if provided
        emailVerified, // Set emailVerified to true for OAuth users
        authProvider: authProvider || undefined, // Track which OAuth provider was used
      })

      // Fetch full user data with relations after creation
      user = await prisma.user.findUnique({
        where: { walletAddress: address.toLowerCase() },
        include: {
          reviews: {
            select: {
              id: true,
              venueId: true,
              rating: true,
              createdAt: true,
            },
          },
          musicianProfile: true,
        },
      })
    }

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Count venues discovered (venues submitted by this user)
    const venuesDiscovered = user.walletAddress
      ? await prisma.venue.count({
          where: {
            submittedBy: { equals: user.walletAddress, mode: 'insensitive' },
          },
        })
      : 0

    // Get review count
    const reviewCount = user.reviews.length

    // Remove sensitive data if profile is not public
    const profileData = {
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      location: user.location,
      profileSlug: user.profileSlug,
      title: user.title,
      skills: user.skills,
      socialLinks: user.socialLinks,
      ensName: user.ensName,
      totalPXPEarned: user.totalCAVEarned, // Note: Using cached value
      badges: user.badges,
      publicProfile: user.publicProfile,
      showPXPBalance: user.showPXPBalance,
      qrCardStyle: user.qrCardStyle,
      emailVerified: user.emailVerified,
      profileCompleted: user.profileCompleted,
      passwordHash: user.passwordHash ? 'set' : null, // Don't expose actual hash, just indicate if set
      createdAt: user.createdAt,
      lastActive: user.lastActive,
    }

    return NextResponse.json({
      profile: profileData,
      musicianProfile: user.musicianProfile, // Include musician profile data
      venuesDiscovered,
      reviewCount,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    const body = await request.json()

    console.log('[Profile Update] Starting update for address:', address)
    console.log('[Profile Update] Request body:', JSON.stringify(body, null, 2))

    // Authentication: Check if requester is profile owner OR blog owner (admin)
    const requesterIdentifier = body.requesterAddress
    const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()

    if (!requesterIdentifier) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Look up the requester user by wallet/username/ID
    const requesterUser = await prisma.user.findFirst({
      where: {
        OR: [
          { walletAddress: { equals: requesterIdentifier, mode: 'insensitive' } },
          { username: { equals: requesterIdentifier, mode: 'insensitive' } },
          { id: isNaN(Number(requesterIdentifier)) ? undefined : Number(requesterIdentifier) },
        ],
      },
    })

    if (!requesterUser) {
      return NextResponse.json({ error: 'Requester not found' }, { status: 401 })
    }

    // Check if requester is blog owner (by wallet address or role)
    const isBlogOwner =
      requesterUser.walletAddress?.toLowerCase() === blogOwnerAddress ||
      requesterUser.role === 'BLOG_OWNER'

    // Look up the profile being edited by wallet/username/profile slug
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { walletAddress: { equals: address, mode: 'insensitive' } },
          { profileSlug: { equals: address, mode: 'insensitive' } },
          { username: { equals: address, mode: 'insensitive' } },
        ],
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if requester is the profile owner (compare user IDs)
    const isProfileOwner = requesterUser.id === user.id

    if (!isProfileOwner && !isBlogOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only edit your own profile' },
        { status: 403 }
      )
    }

    // Username uniqueness validation
    if (body.username) {
      const existingUserWithUsername = await prisma.user.findFirst({
        where: {
          username: { equals: body.username, mode: 'insensitive' },
          id: { not: user.id }, // Exclude current user
        },
        select: {
          id: true,
          username: true,
        },
      })

      if (existingUserWithUsername) {
        return NextResponse.json(
          {
            error: 'Username already taken. Please choose a different username.',
          },
          { status: 409 }
        )
      }
    }

    // Email uniqueness validation
    if (body.email) {
      const existingUserWithEmail = await prisma.user.findFirst({
        where: {
          email: { equals: body.email, mode: 'insensitive' },
          id: { not: user.id }, // Exclude current user
        },
        select: {
          id: true,
          walletAddress: true,
          username: true,
          displayName: true,
        },
      })

      if (existingUserWithEmail) {
        return NextResponse.json(
          {
            error: 'Email already in use by another account',
            suggestMerge: true,
            existingAccount: {
              id: existingUserWithEmail.id,
              walletAddress: existingUserWithEmail.walletAddress,
              displayName: existingUserWithEmail.displayName,
              username: existingUserWithEmail.username,
            },
          },
          { status: 409 }
        )
      }
    }

    // Update user profile using the user's primary key (id)
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        username: body.username,
        displayName: body.displayName,
        email: body.email,
        bio: body.bio,
        avatar: body.avatar,
        location: body.location,
        profileSlug: body.profileSlug,
        title: body.title,
        skills: body.skills,
        socialLinks: body.socialLinks,
        publicProfile: body.publicProfile,
        showPXPBalance: body.showPXPBalance,
        qrCardStyle: body.qrCardStyle,
        profileCompleted: body.profileCompleted,
        profileCompletedAt: body.profileCompleted ? new Date() : undefined,
        lastActive: new Date(),
      },
    })

    // Update or create musician profile if provided
    if (body.musicianProfile) {
      await prisma.musicianProfile.upsert({
        where: {
          userId: user.id,
        },
        create: {
          userId: user.id,
          instruments: body.musicianProfile.instruments || [],
          musicalStyles: body.musicianProfile.musicalStyles || [],
          genres: body.musicianProfile.genres || [],
          experienceLevel: body.musicianProfile.experienceLevel,
          yearsPlaying: body.musicianProfile.yearsPlaying,
          availableForGigs: body.musicianProfile.availableForGigs || false,
          availableForCollab: body.musicianProfile.availableForCollab || false,
          availabilityNotes: body.musicianProfile.availabilityNotes,
          recordingLinks: body.musicianProfile.recordingLinks || [],
          socialMedia: body.musicianProfile.socialMedia || {},
          repertoire: body.musicianProfile.repertoire || [],
        },
        update: {
          instruments: body.musicianProfile.instruments || [],
          musicalStyles: body.musicianProfile.musicalStyles || [],
          genres: body.musicianProfile.genres || [],
          experienceLevel: body.musicianProfile.experienceLevel,
          yearsPlaying: body.musicianProfile.yearsPlaying,
          availableForGigs: body.musicianProfile.availableForGigs || false,
          availableForCollab: body.musicianProfile.availableForCollab || false,
          availabilityNotes: body.musicianProfile.availabilityNotes,
          recordingLinks: body.musicianProfile.recordingLinks || [],
          socialMedia: body.musicianProfile.socialMedia || {},
          repertoire: body.musicianProfile.repertoire || [],
        },
      })
    }

    console.log('[Profile Update] Successfully updated profile for user:', updatedUser.id)
    return NextResponse.json({ profile: updatedUser })
  } catch (error) {
    console.error('[Profile Update] Error updating profile:', error)
    console.error('[Profile Update] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update profile. Please try again.',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
