import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'

/**
 * GET /api/musicians
 *
 * WPB-201: Musicians Directory API
 * Returns all users with musician profiles
 * Supports pagination + filtering by search, collabType, availableForCollab
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filter parameters
    const search = searchParams.get('search')?.trim() || ''
    const collabTypesParam = searchParams.get('collabTypes')?.trim() || ''
    const collabTypes = collabTypesParam ? collabTypesParam.split(',').map((s) => s.trim()) : []
    const availableForCollab = searchParams.get('availableForCollab') === 'true'

    // Advanced search parameters
    const instrumentsParam = searchParams.get('instruments')?.trim() || ''
    const experienceLevel = searchParams.get('experienceLevel')?.trim() || ''
    const availableForGigs = searchParams.get('availableForGigs') === 'true'
    const locationParam = searchParams.get('location')?.trim() || ''
    const influencesParam = searchParams.get('influences')?.trim() || ''
    const songsParam = searchParams.get('songs')?.trim() || ''

    const instruments = instrumentsParam ? instrumentsParam.split(',').map((s) => s.trim()) : []
    const influences = influencesParam ? influencesParam.split(',').map((s) => s.trim()) : []
    const songs = songsParam ? songsParam.split(',').map((s) => s.trim()) : []

    const musicianProfileFilter: any = {}
    if (collabTypes.length) musicianProfileFilter.collaborationTypes = { hasEvery: collabTypes }
    if (availableForCollab) musicianProfileFilter.availableForCollab = true
    if (availableForGigs) musicianProfileFilter.availableForGigs = true
    if (experienceLevel) musicianProfileFilter.experienceLevel = experienceLevel
    if (instruments.length) musicianProfileFilter.instruments = { hasSome: instruments }
    if (influences.length) musicianProfileFilter.influences = { hasSome: influences }
    if (songs.length) musicianProfileFilter.repertoire = { hasSome: songs }

    const hasMusicianFilter = Object.keys(musicianProfileFilter).length > 0

    const where: any = {
      musicianProfile: hasMusicianFilter ? { is: musicianProfileFilter } : { isNot: null },
      ...(search && {
        OR: [
          { displayName: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(locationParam && { location: { contains: locationParam, mode: 'insensitive' } }),
    }

    const db = await getDb()

    const totalCount = await db.user.count({ where })

    const musicians = await db.user.findMany({
      where,
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
        avatar: true,
        location: true,
        title: true,
        profileSlug: true,
        totalPXPEarned: true,
        lastActive: true,
        musicianProfile: {
          select: {
            instruments: true,
            musicalStyles: true,
            genres: true,
            experienceLevel: true,
            yearsPlaying: true,
            availableForGigs: true,
            availableForCollab: true,
            collaborationTypes: true,
            influences: true,
            repertoire: true,
          },
        },
      },
      orderBy: {
        lastActive: 'desc',
      },
      take: limit,
      skip,
    })

    const hasMore = skip + musicians.length < totalCount
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      musicians,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error fetching musicians:', error)
    return NextResponse.json(
      { error: 'Failed to fetch musicians', details: message },
      { status: 500 }
    )
  }
}
