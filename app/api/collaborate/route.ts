/**
 * POST /api/collaborate
 * Send a collaboration request to another musician.
 * Creates a COLLABORATION_REQUEST notification for the recipient.
 * Rate limited to 1 request per sender→recipient pair per 24 hours.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'
import { z } from 'zod'

const schema = z.object({
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  message: z.string().min(1).max(200),
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

    const { recipientAddress, message } = validation.data
    const normalizedRecipient = recipientAddress.toLowerCase()

    if (normalizedRecipient === sender.walletAddress?.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Cannot send a collaboration request to yourself' },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Look up recipient
    const recipient = await db.user.findUnique({
      where: { walletAddress: normalizedRecipient },
      select: { id: true, displayName: true, username: true },
    })

    if (!recipient) {
      return NextResponse.json({ success: false, error: 'Recipient not found' }, { status: 404 })
    }

    // Rate limit: 1 request per sender→recipient pair per 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentRequest = await db.notification.findFirst({
      where: {
        userId: recipient.id,
        type: 'COLLABORATION_REQUEST',
        link: `/profile/${sender.walletAddress}`,
        createdAt: { gte: since },
      },
    })

    if (recentRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already sent a collaboration request to this person in the last 24 hours',
        },
        { status: 429 }
      )
    }

    const senderName = sender.displayName || sender.username || 'A musician'

    await db.notification.create({
      data: {
        userId: recipient.id,
        type: 'COLLABORATION_REQUEST',
        title: `Collaboration request from ${senderName}`,
        message,
        link: `/profile/${sender.walletAddress}`,
      },
    })

    console.log(
      `[collaborate] ${sender.walletAddress} → ${normalizedRecipient}: "${message.slice(0, 50)}…"`
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[collaborate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send collaboration request' },
      { status: 500 }
    )
  }
}
