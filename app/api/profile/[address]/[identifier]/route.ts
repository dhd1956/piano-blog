/**
 * Profile API Route - Musician Profile Management
 * Supports both wallet address and username as identifier
 * Handles GET (view profile) and PUT (update profile) operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params
    const db = await getDb()

    // Find user by wallet address OR username
    const user = await db.user.findFirst({
      where: {
        OR: [{ walletAddress: identifier }, { username: identifier }, { profileSlug: identifier }],
      },
      include: {
        musicianProfile: true, // Include musician profile data
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if profile is public (unless viewing own profile)
    // TODO: Add authentication check for "isOwnProfile"
    if (!user.publicProfile) {
      return NextResponse.json({ error: 'This profile is private' }, { status: 403 })
    }

    // Return user profile with musician profile data
    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        displayName: user.displayName,
        email: user.showPXPBalance ? user.email : null, // Only show email if public
        bio: user.bio,
        avatar: user.avatar,
        location: user.location,
        profileSlug: user.profileSlug,
        title: user.title,
        skills: user.skills,
        socialLinks: user.socialLinks,
        ensName: user.ensName,
        totalPXPEarned: user.showPXPBalance ? user.totalPXPEarned : null,
        badges: user.badges,
        publicProfile: user.publicProfile,
        createdAt: user.createdAt,
        lastActive: user.lastActive,
      },
      musicianProfile: user.musicianProfile
        ? {
            instruments: user.musicianProfile.instruments,
            musicalStyles: user.musicianProfile.musicalStyles,
            genres: user.musicianProfile.genres,
            experienceLevel: user.musicianProfile.experienceLevel,
            yearsPlaying: user.musicianProfile.yearsPlaying,
            availableForGigs: user.musicianProfile.availableForGigs,
            availableForCollab: user.musicianProfile.availableForCollab,
            availabilityNotes: user.musicianProfile.availabilityNotes,
            recordingLinks: user.musicianProfile.recordingLinks,
            socialMedia: user.musicianProfile.socialMedia,
            repertoire: user.musicianProfile.repertoire,
          }
        : null,
    })
  } catch (error: any) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile', message: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params
    const body = await request.json()
    const db = await getDb()

    // TODO: Add authentication - verify user is updating their own profile
    // For now, basic implementation

    // Find user by wallet address OR username
    const user = await db.user.findFirst({
      where: {
        OR: [{ walletAddress: identifier }, { username: identifier }],
      },
      include: {
        musicianProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update musician profile (create if doesn't exist)
    const musicianProfileData: any = {}

    if (body.instruments !== undefined) musicianProfileData.instruments = body.instruments
    if (body.musicalStyles !== undefined) musicianProfileData.musicalStyles = body.musicalStyles
    if (body.genres !== undefined) musicianProfileData.genres = body.genres
    if (body.experienceLevel !== undefined)
      musicianProfileData.experienceLevel = body.experienceLevel
    if (body.yearsPlaying !== undefined) musicianProfileData.yearsPlaying = body.yearsPlaying
    if (body.availableForGigs !== undefined)
      musicianProfileData.availableForGigs = body.availableForGigs
    if (body.availableForCollab !== undefined)
      musicianProfileData.availableForCollab = body.availableForCollab
    if (body.availabilityNotes !== undefined)
      musicianProfileData.availabilityNotes = body.availabilityNotes
    if (body.recordingLinks !== undefined) musicianProfileData.recordingLinks = body.recordingLinks
    if (body.socialMedia !== undefined) musicianProfileData.socialMedia = body.socialMedia
    if (body.repertoire !== undefined) musicianProfileData.repertoire = body.repertoire

    // Upsert musician profile
    const musicianProfile = await db.musicianProfile.upsert({
      where: { userId: user.id },
      update: musicianProfileData,
      create: {
        userId: user.id,
        ...musicianProfileData,
      },
    })

    // Also update user fields if provided
    const userUpdateData: any = {}
    if (body.displayName !== undefined) userUpdateData.displayName = body.displayName
    if (body.bio !== undefined) userUpdateData.bio = body.bio
    if (body.avatar !== undefined) userUpdateData.avatar = body.avatar
    if (body.location !== undefined) userUpdateData.location = body.location
    if (body.title !== undefined) userUpdateData.title = body.title

    if (Object.keys(userUpdateData).length > 0) {
      await db.user.update({
        where: { id: user.id },
        data: userUpdateData,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      musicianProfile,
    })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile', message: error.message },
      { status: 500 }
    )
  }
}
