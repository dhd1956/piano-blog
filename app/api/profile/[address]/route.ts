import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

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
    const user = await prisma.user.findFirst({
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
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Count venues discovered (venues submitted by this user)
    const venuesDiscovered = await prisma.venue.count({
      where: {
        submittedBy: { equals: user.walletAddress, mode: 'insensitive' },
      },
    })

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

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: {
        walletAddress: address,
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

    return NextResponse.json({ profile: updatedUser })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
