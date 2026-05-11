/**
 * GET  /api/messages/[id] — full session with all messages
 * PATCH /api/messages/[id] — toggle saved state for the calling user
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'
import { z } from 'zod'

const participantSelect = {
  id: true,
  displayName: true,
  username: true,
  avatar: true,
  profileSlug: true,
  walletAddress: true,
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticate(request as any)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const sessionId = parseInt(id)
    if (isNaN(sessionId)) return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })

    const db = await getDb()
    const session = await db.collabSession.findUnique({
      where: { id: sessionId },
      include: {
        creator: { select: participantSelect },
        recipient: { select: participantSelect },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, senderId: true, body: true, createdAt: true },
        },
      },
    })

    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session.creatorId !== user.id && session.recipientId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isCreator = session.creatorId === user.id
    return NextResponse.json({
      session: {
        ...session,
        saved: isCreator ? session.savedByCreator : session.savedByRecipient,
      },
    })
  } catch (error: any) {
    console.error('GET /api/messages/[id] error:', error)
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 })
  }
}

const patchSchema = z.object({
  saved: z.boolean(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticate(request as any)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const sessionId = parseInt(id)
    if (isNaN(sessionId)) return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })

    const body = patchSchema.safeParse(await request.json())
    if (!body.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const db = await getDb()
    const session = await db.collabSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isCreator = session.creatorId === user.id
    const isRecipient = session.recipientId === user.id
    if (!isCreator && !isRecipient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.collabSession.update({
      where: { id: sessionId },
      data: isCreator ? { savedByCreator: body.data.saved } : { savedByRecipient: body.data.saved },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PATCH /api/messages/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}
