/**
 * Notifications API
 * GET  /api/notifications        - List user's notifications (unread first)
 * PATCH /api/notifications       - Mark all notifications as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request as any)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
      take: 30,
    })

    const unreadCount = notifications.filter((n) => !n.read).length

    return NextResponse.json({ success: true, notifications, unreadCount })
  } catch (error: any) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticate(request as any)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true, readAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PATCH /api/notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}
