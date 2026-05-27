/**
 * Group Members API
 * POST   /api/groups/[slug]/members — add a member (owner or BLOG_OWNER)
 * DELETE /api/groups/[slug]/members — remove a member (owner or BLOG_OWNER)
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
    const { userIdentifier } = body
    if (!userIdentifier) {
      return NextResponse.json({ success: false, error: 'Missing userIdentifier' }, { status: 400 })
    }

    // Find target user by displayName, username, email, or walletAddress
    const target = await db.user.findFirst({
      where: {
        OR: [
          { displayName: { equals: userIdentifier, mode: 'insensitive' } },
          { username: { equals: userIdentifier, mode: 'insensitive' } },
          { email: { equals: userIdentifier, mode: 'insensitive' } },
          { walletAddress: { equals: userIdentifier, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        displayName: true,
        username: true,
        avatar: true,
        profileSlug: true,
        walletAddress: true,
      },
    })

    if (!target) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Upsert — idempotent
    await db.groupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId: target.id } },
      create: { groupId: group.id, userId: target.id, addedBy: user.id },
      update: { addedBy: user.id, addedAt: new Date() },
    })

    return NextResponse.json({ success: true, member: target })
  } catch (error: any) {
    console.error('POST /api/groups/[slug]/members error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add member' }, { status: 500 })
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
    const { userId } = body
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 })
    }

    await db.groupMember.deleteMany({
      where: { groupId: group.id, userId: parseInt(userId) },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/groups/[slug]/members error:', error)
    return NextResponse.json({ success: false, error: 'Failed to remove member' }, { status: 500 })
  }
}
