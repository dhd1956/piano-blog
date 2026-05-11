/**
 * GET /api/messages
 * List all ColabSessions for the current user (as creator or recipient),
 * ordered by most recent activity. Includes the other participant's profile
 * summary and a snippet of the last message.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request as any)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()

    const sessions = await db.collabSession.findMany({
      where: {
        OR: [{ creatorId: user.id }, { recipientId: user.id }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: {
          select: { id: true, displayName: true, username: true, avatar: true, profileSlug: true },
        },
        recipient: {
          select: { id: true, displayName: true, username: true, avatar: true, profileSlug: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, body: true, senderId: true, createdAt: true },
        },
      },
    })

    const result = sessions.map((s) => {
      const isCreator = s.creatorId === user.id
      const otherUser = isCreator ? s.recipient : s.creator
      const saved = isCreator ? s.savedByCreator : s.savedByRecipient
      const lastMessage = s.messages[0] ?? null

      return {
        id: s.id,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        saved,
        otherUser,
        lastMessage,
      }
    })

    return NextResponse.json({ sessions: result })
  } catch (error: any) {
    console.error('GET /api/messages error:', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}
