/**
 * Notes API
 * GET  /api/notes — list notes for a group, event, or profile
 * POST /api/notes — create a note (any authenticated user)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { authenticate, requireAuth } from '@/lib/auth-middleware'
import { awardPracticeSession } from '@/lib/pxp-rewards'

const noteSelect = {
  id: true,
  title: true,
  body: true,
  practiceMinutes: true,
  qualityRating: true,
  youtubeUrls: true,
  isPrivate: true,
  pxpAwarded: true,
  createdAt: true,
  updatedAt: true,
  groupId: true,
  eventId: true,
  profileUserId: true,
  author: {
    select: {
      id: true,
      displayName: true,
      username: true,
      avatar: true,
      profileSlug: true,
      walletAddress: true,
    },
  },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId') ? parseInt(searchParams.get('groupId')!) : undefined
    const eventId = searchParams.get('eventId') ? parseInt(searchParams.get('eventId')!) : undefined
    const profileUserId = searchParams.get('profileUserId')
      ? parseInt(searchParams.get('profileUserId')!)
      : undefined
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    const authUser = await authenticate(request as any)

    const db = await getDb()

    const where: any = {}

    if (groupId && !isNaN(groupId)) where.groupId = groupId
    else if (eventId && !isNaN(eventId)) where.eventId = eventId
    else if (profileUserId && !isNaN(profileUserId)) where.profileUserId = profileUserId
    else {
      return NextResponse.json(
        { success: false, error: 'Provide one of: groupId, eventId, profileUserId' },
        { status: 400 }
      )
    }

    // Private notes only visible to their author
    if (!authUser) {
      where.isPrivate = false
    } else {
      where.OR = [{ isPrivate: false }, { authorId: authUser.id }]
    }

    const [notes, totalCount] = await Promise.all([
      db.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: noteSelect,
      }),
      db.note.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      notes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page < Math.ceil(totalCount / limit),
      },
    })
  } catch (error: any) {
    console.error('GET /api/notes error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request as any)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const body = await request.json()
    const {
      groupId,
      eventId,
      profileUserId,
      title,
      body: noteBody,
      practiceMinutes,
      qualityRating,
      youtubeUrls,
      isPrivate,
    } = body

    if (!noteBody || typeof noteBody !== 'string' || noteBody.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Note body is required' }, { status: 400 })
    }

    // Exactly one attachment
    const attachments = [groupId, eventId, profileUserId].filter((v) => v != null)
    if (attachments.length !== 1) {
      return NextResponse.json(
        { success: false, error: 'Provide exactly one of: groupId, eventId, profileUserId' },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Group notes: must be a member or owner
    if (groupId) {
      const group = await db.group.findUnique({
        where: { id: groupId },
        select: {
          ownerId: true,
          members: { where: { userId: user.id }, select: { userId: true } },
        },
      })
      if (!group) {
        return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 })
      }
      const isMember = group.ownerId === user.id || group.members.length > 0
      if (!isMember) {
        return NextResponse.json(
          { success: false, error: 'Only group members can add notes' },
          { status: 403 }
        )
      }
    }

    const parsedPracticeMinutes = practiceMinutes != null ? parseInt(String(practiceMinutes)) : null
    const parsedQuality = qualityRating != null ? parseInt(String(qualityRating)) : null

    if (parsedQuality != null && (parsedQuality < 1 || parsedQuality > 5)) {
      return NextResponse.json(
        { success: false, error: 'qualityRating must be 1–5' },
        { status: 400 }
      )
    }

    const note = await db.note.create({
      data: {
        authorId: user.id,
        groupId: groupId ? parseInt(String(groupId)) : null,
        eventId: eventId ? parseInt(String(eventId)) : null,
        profileUserId: profileUserId ? parseInt(String(profileUserId)) : null,
        title: title?.trim() || null,
        body: noteBody.trim(),
        practiceMinutes:
          parsedPracticeMinutes != null && parsedPracticeMinutes > 0 ? parsedPracticeMinutes : null,
        qualityRating: parsedQuality,
        youtubeUrls: Array.isArray(youtubeUrls) ? youtubeUrls.filter(Boolean) : [],
        isPrivate: Boolean(isPrivate),
      },
      select: noteSelect,
    })

    // Award PXP if practice time was logged and user has a wallet
    let pxpAwarded = 0
    if (parsedPracticeMinutes != null && parsedPracticeMinutes > 0 && user.walletAddress) {
      const reward = await awardPracticeSession(user.id, user.walletAddress, note.id)
      if (reward.success) {
        pxpAwarded = reward.pxpAwarded
        await db.note.update({ where: { id: note.id }, data: { pxpAwarded: true } })
      }
    }

    return NextResponse.json({ success: true, note, pxpAwarded }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/notes error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create note' }, { status: 500 })
  }
}
