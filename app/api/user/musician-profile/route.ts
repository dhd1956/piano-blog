import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * API Route: Create or update musician profile
 * POST /api/user/musician-profile
 *
 * Body: {
 *   userId: number
 *   instruments?: string[]
 *   musicalStyles?: string[]
 *   genres?: string[]
 *   experienceLevel?: string
 *   yearsPlaying?: number
 *   availableForGigs?: boolean
 *   availableForCollab?: boolean
 *   availabilityNotes?: string
 *   recordingLinks?: string[]
 *   socialMedia?: object
 *   repertoire?: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...profileData } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if musician profile already exists
    const existingProfile = await prisma.musicianProfile.findUnique({
      where: { userId },
    })

    let musicianProfile

    if (existingProfile) {
      // Update existing profile
      musicianProfile = await prisma.musicianProfile.update({
        where: { userId },
        data: {
          ...profileData,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new musician profile with defaults
      musicianProfile = await prisma.musicianProfile.create({
        data: {
          userId,
          instruments: profileData.instruments || [],
          musicalStyles: profileData.musicalStyles || [],
          genres: profileData.genres || [],
          experienceLevel: profileData.experienceLevel || null,
          yearsPlaying: profileData.yearsPlaying || null,
          availableForGigs: profileData.availableForGigs || false,
          availableForCollab: profileData.availableForCollab || false,
          availabilityNotes: profileData.availabilityNotes || null,
          recordingLinks: profileData.recordingLinks || [],
          socialMedia: profileData.socialMedia || null,
          repertoire: profileData.repertoire || [],
        },
      })
    }

    return NextResponse.json({ success: true, musicianProfile })
  } catch (error: any) {
    console.error('Error creating/updating musician profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save musician profile' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/user/musician-profile?userId=123
 * Retrieve musician profile for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const musicianProfile = await prisma.musicianProfile.findUnique({
      where: { userId: parseInt(userId) },
    })

    if (!musicianProfile) {
      return NextResponse.json({ error: 'Musician profile not found' }, { status: 404 })
    }

    return NextResponse.json({ musicianProfile })
  } catch (error: any) {
    console.error('Error fetching musician profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch musician profile' },
      { status: 500 }
    )
  }
}
