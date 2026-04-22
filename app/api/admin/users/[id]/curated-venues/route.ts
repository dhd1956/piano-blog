/**
 * GET /api/admin/users/[id]/curated-venues
 * Returns the venues a user is assigned to curate (blog owner only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { requireRole } from '@/lib/auth-middleware'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const authResult = await requireRole(request as any, [UserRole.BLOG_OWNER])
    if (authResult instanceof NextResponse) return authResult

    const db = await getDb()
    const assignments = await db.venueCurator.findMany({
      where: { userId },
      include: {
        venue: { select: { id: true, name: true, city: true, slug: true } },
      },
      orderBy: { assignedAt: 'asc' },
    })

    return NextResponse.json({ venues: assignments.map((a) => a.venue) })
  } catch (error) {
    console.error('GET curated-venues error:', error)
    return NextResponse.json({ error: 'Failed to fetch curated venues' }, { status: 500 })
  }
}
