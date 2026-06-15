/**
 * GET /api/notes/my — all notes authored by the current user, with aggregate metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request as any)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const db = await getDb()

    const [notes, pxpPayments] = await Promise.all([
      db.note.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: 'desc' },
        select: {
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
          group: { select: { id: true, slug: true, name: true } },
          event: { select: { id: true, title: true } },
          profileUser: {
            select: { id: true, displayName: true, username: true, profileSlug: true },
          },
        },
      }),
      db.pXPPayment.findMany({
        where: {
          toAddress: user.walletAddress ?? '',
          paymentType: 'note_practice_session',
        },
        select: {
          id: true,
          amount: true,
          memo: true,
          blockTimestamp: true,
        },
        orderBy: { blockTimestamp: 'desc' },
      }),
    ])

    const totalPracticeMinutes = notes.reduce((sum, n) => sum + (n.practiceMinutes ?? 0), 0)
    const ratedNotes = notes.filter((n) => n.qualityRating != null)
    const averageQuality =
      ratedNotes.length > 0
        ? ratedNotes.reduce((sum, n) => sum + (n.qualityRating ?? 0), 0) / ratedNotes.length
        : null
    const pxpFromNotes = pxpPayments.reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      success: true,
      notes,
      metrics: {
        totalNotes: notes.length,
        totalPracticeMinutes,
        averageQuality: averageQuality != null ? Math.round(averageQuality * 10) / 10 : null,
        pxpFromNotes,
      },
      pxpPayments,
    })
  } catch (error: any) {
    console.error('GET /api/notes/my error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load notes' }, { status: 500 })
  }
}
