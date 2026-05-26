/**
 * POST /api/collaborate
 * Send a collaboration request to another musician.
 * Creates a CollabSession (or reuses an existing one), appends the opening
 * message, and sends a COLLABORATION_REQUEST notification to the recipient
 * linking to /messages/[sessionId].
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'
import { sendCollabMessageEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z
  .object({
    recipientAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .optional(),
    recipientId: z.number().int().positive().optional(),
    message: z.string().min(1).max(200),
  })
  .refine((d) => d.recipientAddress || d.recipientId, {
    message: 'Either recipientAddress or recipientId is required',
  })

export async function POST(request: NextRequest) {
  try {
    const sender = await authenticate(request as any)
    if (!sender) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = schema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { recipientAddress, recipientId: recipientIdParam, message } = validation.data

    const db = await getDb()

    // Look up recipient by address or id
    const recipient = await db.user.findFirst({
      where: recipientIdParam
        ? { id: recipientIdParam }
        : { walletAddress: recipientAddress!.toLowerCase() },
      select: { id: true, displayName: true, username: true, email: true },
    })

    if (!recipient) {
      return NextResponse.json({ success: false, error: 'Recipient not found' }, { status: 404 })
    }

    if (recipient.id === sender.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot send a collaboration request to yourself' },
        { status: 400 }
      )
    }

    const senderName = sender.displayName || sender.username || 'A musician'

    // Check for an existing session in either direction
    const existingSession = await db.collabSession.findFirst({
      where: {
        OR: [
          { creatorId: sender.id, recipientId: recipient.id },
          { creatorId: recipient.id, recipientId: sender.id },
        ],
      },
    })

    if (existingSession) {
      // Add a new message to the existing session and notify the recipient
      await db.$transaction([
        db.collabMessage.create({
          data: { sessionId: existingSession.id, senderId: sender.id, body: message },
        }),
        db.collabSession.update({
          where: { id: existingSession.id },
          data: { updatedAt: new Date() },
        }),
        db.notification.create({
          data: {
            userId: recipient.id,
            type: 'COLLABORATION_REQUEST',
            title: `Collaboration request from ${senderName}`,
            message,
            link: `/messages/${existingSession.id}`,
          },
        }),
      ])

      if (recipient.email) {
        sendCollabMessageEmail({
          recipientEmail: recipient.email,
          recipientName: recipient.displayName || recipient.username || 'there',
          senderName,
          message,
          sessionId: existingSession.id,
        }).catch((e) => console.error('[collaborate] email error:', e))
      }

      return NextResponse.json({ success: true, sessionId: existingSession.id, alreadySent: true })
    }

    // Create new session, first message, and notification atomically
    const [session] = await db.$transaction([
      db.collabSession.create({
        data: { creatorId: sender.id, recipientId: recipient.id },
      }),
    ])

    await db.$transaction([
      db.collabMessage.create({
        data: { sessionId: session.id, senderId: sender.id, body: message },
      }),
      db.notification.create({
        data: {
          userId: recipient.id,
          type: 'COLLABORATION_REQUEST',
          title: `Collaboration request from ${senderName}`,
          message,
          link: `/messages/${session.id}`,
        },
      }),
    ])

    if (recipient.email) {
      sendCollabMessageEmail({
        recipientEmail: recipient.email,
        recipientName: recipient.displayName || recipient.username || 'there',
        senderName,
        message,
        sessionId: session.id,
      }).catch((e) => console.error('[collaborate] email error:', e))
    }

    console.log(
      `[collaborate] session ${session.id}: sender ${sender.id} → recipient ${recipient.id}: "${message.slice(0, 50)}…"`
    )

    return NextResponse.json({ success: true, sessionId: session.id, alreadySent: false })
  } catch (error: any) {
    console.error('[collaborate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send collaboration request' },
      { status: 500 }
    )
  }
}
