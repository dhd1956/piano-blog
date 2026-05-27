/**
 * Group Venues API
 * POST   /api/groups/[slug]/venues — link a venue (owner or BLOG_OWNER)
 * DELETE /api/groups/[slug]/venues — unlink a venue (owner or BLOG_OWNER)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { authenticate } from '@/lib/auth-middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const user = await authenticate(request as any)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const group = await db.group.findUnique({ where: { slug } })
    if (!group || !group.isActive) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 })
    }

    const isOwner = group.ownerId === user.id
    const isBlogOwner = user.role === 'BLOG_OWNER'
    if (!isOwner && !isBlogOwner) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const venueId = parseInt(body.venueId)
    if (isNaN(venueId)) {
      return NextResponse.json({ success: false, error: 'Invalid venueId' }, { status: 400 })
    }

    const venue = await db.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        name: true,
        city: true,
        province: true,
        country: true,
        isVirtual: true,
        slug: true,
      },
    })
    if (!venue) {
      return NextResponse.json({ success: false, error: 'Venue not found' }, { status: 404 })
    }

    await db.groupVenue.upsert({
      where: { groupId_venueId: { groupId: group.id, venueId } },
      create: { groupId: group.id, venueId, addedBy: user.id },
      update: { addedBy: user.id, addedAt: new Date() },
    })

    return NextResponse.json({ success: true, venue })
  } catch (error: any) {
    console.error('POST /api/groups/[slug]/venues error:', error)
    return NextResponse.json({ success: false, error: 'Failed to link venue' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const user = await authenticate(request as any)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const group = await db.group.findUnique({ where: { slug } })
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 })
    }

    const isOwner = group.ownerId === user.id
    const isBlogOwner = user.role === 'BLOG_OWNER'
    if (!isOwner && !isBlogOwner) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const venueId = parseInt(body.venueId)
    if (isNaN(venueId)) {
      return NextResponse.json({ success: false, error: 'Invalid venueId' }, { status: 400 })
    }

    await db.groupVenue.deleteMany({ where: { groupId: group.id, venueId } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/groups/[slug]/venues error:', error)
    return NextResponse.json({ success: false, error: 'Failed to unlink venue' }, { status: 500 })
  }
}
