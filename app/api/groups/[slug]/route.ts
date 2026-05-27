/**
 * Group Detail API
 * GET    /api/groups/[slug] — full group detail (public)
 * PUT    /api/groups/[slug] — update group (owner or BLOG_OWNER)
 * DELETE /api/groups/[slug] — soft-delete group (owner or BLOG_OWNER)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { authenticate } from '@/lib/auth-middleware'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const db = await getDb()

    const group = await db.group.findUnique({
      where: { slug, isActive: true },
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            profileSlug: true,
          },
        },
        members: {
          orderBy: { addedAt: 'asc' },
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
        },
        venues: {
          orderBy: { addedAt: 'asc' },
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                city: true,
                province: true,
                country: true,
                isVirtual: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, group })
  } catch (error: any) {
    console.error('GET /api/groups/[slug] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load group' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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
    const { name, description, avatar } = body

    const updated = await db.group.update({
      where: { slug },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(avatar !== undefined && { avatar: avatar?.trim() || null }),
      },
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            profileSlug: true,
          },
        },
        _count: { select: { members: true, venues: true } },
      },
    })

    return NextResponse.json({
      success: true,
      group: {
        ...updated,
        memberCount: updated._count.members,
        venueCount: updated._count.venues,
      },
    })
  } catch (error: any) {
    console.error('PUT /api/groups/[slug] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update group' }, { status: 500 })
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

    await db.group.update({ where: { slug }, data: { isActive: false } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/groups/[slug] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete group' }, { status: 500 })
  }
}
