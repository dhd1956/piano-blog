import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { requireRole } from '@/lib/auth-middleware'
import { UserRole } from '@prisma/client'

/**
 * GET /api/admin/events
 * List events with filters. BLOG_OWNER only.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireRole(request as any, [UserRole.BLOG_OWNER])
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search') || ''
  const venueId = searchParams.get('venueId') ? parseInt(searchParams.get('venueId')!) : undefined
  const status = searchParams.get('status') || ''
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined

  const db = await getDb()

  const now = new Date()

  // When filtering by UPCOMING/COMPLETED, also constrain the date so that
  // stale rows (status never updated after the event passed) don't bleed
  // through. Events are not automatically transitioned in the DB.
  const impliedDateFilter =
    status === 'UPCOMING'
      ? { startDate: { gte: now } }
      : status === 'COMPLETED'
        ? { startDate: { lt: now } }
        : {}

  const where: any = {
    ...(search && {
      title: { contains: search, mode: 'insensitive' },
    }),
    ...(venueId && { venueId }),
    ...(status && { status }),
    ...impliedDateFilter,
    ...(from || to
      ? {
          startDate: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }
      : {}),
  }

  const events = await db.event.findMany({
    where,
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      status: true,
      eventType: true,
      venue: { select: { id: true, name: true, city: true } },
      organizer: { select: { id: true, displayName: true, username: true } },
      seriesId: true,
    },
    orderBy: { startDate: 'asc' },
    take: 200,
  })

  const venues = await db.venue.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ events, venues })
}

/**
 * POST /api/admin/events/bulk-cancel
 * Bulk cancel events by ID. BLOG_OWNER only.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireRole(request as any, [UserRole.BLOG_OWNER])
  if (authResult instanceof NextResponse) return authResult

  const body = await request.json()
  const { eventIds, reason } = body as { eventIds: number[]; reason?: string }

  if (!Array.isArray(eventIds) || eventIds.length === 0) {
    return NextResponse.json({ error: 'No event IDs provided' }, { status: 400 })
  }

  const db = await getDb()

  const result = await db.event.updateMany({
    where: {
      id: { in: eventIds },
      status: { not: 'CANCELLED' },
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason || 'Bulk cancelled by admin',
    },
  })

  return NextResponse.json({ cancelled: result.count })
}
