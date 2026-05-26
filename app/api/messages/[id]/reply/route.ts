/**
 * POST /api/messages/[id]/reply
 * Append a message to an existing CollabSession and notify the other participant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'
import { sendCollabMessageEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  body: z.string().min(1).max(500),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticate(request as any)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const sessionId = parseInt(id)
    if (isNaN(sessionId)) return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Message must be 1–500 characters' }, { status: 400 })
    }

    const db = await getDb()
    const session = await db.collabSession.findUnique({
      where: { id: sessionId },
      include: {
        creator: { select: { id: true, displayName: true, username: true, email: true } },
        recipient: { select: { id: true, displayName: true, username: true, email: true } },
      },
    })

    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isCreator = session.creatorId === user.id
    const isRecipient = session.recipientId === user.id
    if (!isCreator && !isRecipient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const otherUser = isCreator ? session.recipient : session.creator
    const senderName =
      (isCreator ? session.creator.displayName : session.recipient.displayName) ||
      (isCreator ? session.creator.username : session.recipient.username) ||
      'Someone'

    const [message] = await db.$transaction([
      db.collabMessage.create({
        data: { sessionId, senderId: user.id, body: parsed.data.body },
        select: { id: true, senderId: true, body: true, createdAt: true },
      }),
      db.collabSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      }),
      db.notification.create({
        data: {
          userId: otherUser.id,
          type: 'COLLABORATION_MESSAGE',
          title: `New message from ${senderName}`,
          message: parsed.data.body.slice(0, 100),
          link: `/messages/${sessionId}`,
        },
      }),
    ])

    if (otherUser.email) {
      sendCollabMessageEmail({
        recipientEmail: otherUser.email,
        recipientName: otherUser.displayName || otherUser.username || 'there',
        senderName,
        message: parsed.data.body,
        sessionId,
      }).catch((e) => console.error('[reply] email error:', e))
    }

    return NextResponse.json({ success: true, message })
  } catch (error: any) {
    console.error('POST /api/messages/[id]/reply error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
