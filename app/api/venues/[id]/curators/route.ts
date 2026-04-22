/**
 * Venue Curator Assignment API
 * GET    /api/venues/[id]/curators  — list assigned curators (public)
 * POST   /api/venues/[id]/curators  — assign a curator (blog owner only)
 * DELETE /api/venues/[id]/curators  — remove a curator assignment (blog owner only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const venueId = parseInt(id)
    if (isNaN(venueId)) {
      return NextResponse.json({ error: 'Invalid venue ID' }, { status: 400 })
    }

    const db = await getDb()
    const curators = await db.venueCurator.findMany({
      where: { venueId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            profileSlug: true,
            walletAddress: true,
          },
        },
      },
      orderBy: { assignedAt: 'asc' },
    })

    return NextResponse.json({ curators })
  } catch (error) {
    console.error('GET /api/venues/[id]/curators error:', error)
    return NextResponse.json({ error: 'Failed to fetch curators' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const venueId = parseInt(id)
    if (isNaN(venueId)) {
      return NextResponse.json({ error: 'Invalid venue ID' }, { status: 400 })
    }

    const user = await authenticate(request as any)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'BLOG_OWNER') {
      return NextResponse.json(
        { error: 'Only the blog owner can assign curators' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userIdentifier } = body
    if (!userIdentifier) {
      return NextResponse.json({ error: 'Missing userIdentifier' }, { status: 400 })
    }

    const db = await getDb()

    // Find venue
    const venue = await db.venue.findUnique({ where: { id: venueId } })
    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Find the user to assign
    const target = await db.user.findFirst({
      where: {
        OR: [
          { walletAddress: { equals: userIdentifier, mode: 'insensitive' } },
          { username: { equals: userIdentifier, mode: 'insensitive' } },
          { email: { equals: userIdentifier, mode: 'insensitive' } },
        ],
      },
    })

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (target.role !== 'CURATOR' && target.role !== 'BLOG_OWNER') {
      return NextResponse.json(
        { error: 'User must have the CURATOR role to be assigned to a venue' },
        { status: 400 }
      )
    }

    // Upsert — idempotent
    await db.venueCurator.upsert({
      where: { venueId_userId: { venueId, userId: target.id } },
      create: { venueId, userId: target.id, assignedBy: user.id },
      update: { assignedBy: user.id, assignedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      curator: {
        id: target.id,
        displayName: target.displayName,
        username: target.username,
        avatar: target.avatar,
        profileSlug: target.profileSlug,
        walletAddress: target.walletAddress,
      },
    })
  } catch (error) {
    console.error('POST /api/venues/[id]/curators error:', error)
    return NextResponse.json({ error: 'Failed to assign curator' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const venueId = parseInt(id)
    if (isNaN(venueId)) {
      return NextResponse.json({ error: 'Invalid venue ID' }, { status: 400 })
    }

    const user = await authenticate(request as any)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'BLOG_OWNER') {
      return NextResponse.json(
        { error: 'Only the blog owner can remove curators' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId } = body
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const db = await getDb()
    await db.venueCurator.deleteMany({ where: { venueId, userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/venues/[id]/curators error:', error)
    return NextResponse.json({ error: 'Failed to remove curator' }, { status: 500 })
  }
}
