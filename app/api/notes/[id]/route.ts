/**
 * Notes API — single note
 * GET    /api/notes/[id] — get note (403 if private and not author)
 * PUT    /api/notes/[id] — update note (author only)
 * DELETE /api/notes/[id] — delete note (author only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { authenticate, requireAuth } from '@/lib/auth-middleware'

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
  authorId: true,
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const noteId = parseInt(id)
    if (isNaN(noteId)) {
      return NextResponse.json({ success: false, error: 'Invalid note ID' }, { status: 400 })
    }

    const authUser = await authenticate(request as any)
    const db = await getDb()

    const note = await db.note.findUnique({ where: { id: noteId }, select: noteSelect })
    if (!note) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 })
    }

    if (note.isPrivate && (!authUser || authUser.id !== note.authorId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ success: true, note })
  } catch (error: any) {
    console.error('GET /api/notes/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load note' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const noteId = parseInt(id)
    if (isNaN(noteId)) {
      return NextResponse.json({ success: false, error: 'Invalid note ID' }, { status: 400 })
    }

    const authResult = await requireAuth(request as any)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const db = await getDb()
    const existing = await db.note.findUnique({ where: { id: noteId }, select: { authorId: true } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 })
    }
    if (existing.authorId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, body: noteBody, practiceMinutes, qualityRating, youtubeUrls, isPrivate } = body

    const parsedQuality = qualityRating != null ? parseInt(String(qualityRating)) : undefined
    if (parsedQuality != null && (parsedQuality < 1 || parsedQuality > 5)) {
      return NextResponse.json(
        { success: false, error: 'qualityRating must be 1–5' },
        { status: 400 }
      )
    }

    const data: any = {}
    if (title !== undefined) data.title = title?.trim() || null
    if (noteBody !== undefined) data.body = noteBody.trim()
    if (practiceMinutes !== undefined) {
      const mins = parseInt(String(practiceMinutes))
      data.practiceMinutes = mins > 0 ? mins : null
    }
    if (qualityRating !== undefined) data.qualityRating = parsedQuality ?? null
    if (youtubeUrls !== undefined)
      data.youtubeUrls = Array.isArray(youtubeUrls) ? youtubeUrls.filter(Boolean) : []
    if (isPrivate !== undefined) data.isPrivate = Boolean(isPrivate)

    const note = await db.note.update({
      where: { id: noteId },
      data,
      select: { ...noteSelect, authorId: false },
    })

    return NextResponse.json({ success: true, note })
  } catch (error: any) {
    console.error('PUT /api/notes/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update note' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const noteId = parseInt(id)
    if (isNaN(noteId)) {
      return NextResponse.json({ success: false, error: 'Invalid note ID' }, { status: 400 })
    }

    const authResult = await requireAuth(request as any)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const db = await getDb()
    const existing = await db.note.findUnique({ where: { id: noteId }, select: { authorId: true } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 })
    }
    if (existing.authorId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    await db.note.delete({ where: { id: noteId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/notes/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete note' }, { status: 500 })
  }
}
