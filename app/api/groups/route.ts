/**
 * Groups API
 * GET  /api/groups — list active groups (public)
 * POST /api/groups — create group (CURATOR or BLOG_OWNER)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { requireRole, authenticate } from '@/lib/auth-middleware'
import { UserRole } from '@prisma/client'

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const venueId = searchParams.get('venueId') ? parseInt(searchParams.get('venueId')!) : undefined
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    const db = await getDb()

    const where: any = { isActive: true }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (venueId && !isNaN(venueId)) {
      where.venues = { some: { venueId } }
    }

    const [groups, totalCount] = await Promise.all([
      db.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      db.group.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      groups: groups.map((g) => ({
        id: g.id,
        slug: g.slug,
        name: g.name,
        description: g.description,
        avatar: g.avatar,
        isActive: g.isActive,
        createdAt: g.createdAt,
        owner: g.owner,
        memberCount: g._count.members,
        venueCount: g._count.venues,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error: any) {
    console.error('GET /api/groups error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request as any, [UserRole.CURATOR, UserRole.BLOG_OWNER])
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const body = await request.json()
    const { name, description, avatar } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Group name is required' }, { status: 400 })
    }

    const db = await getDb()

    // Generate unique slug
    let slug = makeSlug(name.trim())
    const existing = await db.group.findFirst({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const group = await db.group.create({
      data: {
        slug,
        name: name.trim(),
        description: description?.trim() || null,
        avatar: avatar?.trim() || null,
        ownerId: user.id,
      },
      include: {
        owner: {
          select: { id: true, displayName: true, username: true, avatar: true, profileSlug: true },
        },
        _count: { select: { members: true, venues: true } },
      },
    })

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        slug: group.slug,
        name: group.name,
        description: group.description,
        avatar: group.avatar,
        isActive: group.isActive,
        createdAt: group.createdAt,
        owner: group.owner,
        memberCount: group._count.members,
        venueCount: group._count.venues,
      },
    })
  } catch (error: any) {
    console.error('POST /api/groups error:', error)
    // Surface Prisma error codes to help diagnose missing migrations
    const detail = error?.message || ''
    const isMissingTable =
      error?.code === 'P2021' || detail.includes('does not exist') || detail.includes('relation')
    return NextResponse.json(
      {
        success: false,
        error: isMissingTable
          ? 'Database table missing — please apply the groups migration in Supabase.'
          : 'Failed to create group',
        detail,
      },
      { status: 500 }
    )
  }
}
