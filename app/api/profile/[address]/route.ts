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
      await UserService.findOrCreateUser(address)

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
      walletAddress: user.walletAddress,
      username: user.username,
      displayName: user.displayName,
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

    // Authentication: Check if requester is profile owner OR blog owner (admin)
    const requesterAddress = body.requesterAddress?.toLowerCase()
    const blogOwnerAddress = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()
    const profileAddress = address.toLowerCase()

    if (!requesterAddress) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const isProfileOwner = requesterAddress === profileAddress
    const isBlogOwner = requesterAddress === blogOwnerAddress

    if (!isProfileOwner && !isBlogOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only edit your own profile' },
        { status: 403 }
      )
    }

    // First, get the user to find their userId
    const user = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: {
        walletAddress: address.toLowerCase(),
      },
      data: {
        username: body.username,
        displayName: body.displayName,
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

    return NextResponse.json({ profile: updatedUser })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
