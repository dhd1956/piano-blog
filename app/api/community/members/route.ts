/**
 * GET /api/community/members
 * Public endpoint — returns display name and role only (no email, no wallet)
 */

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'

export async function GET() {
  try {
    const db = await getDb()
    const users = await db.user.findMany({
      where: { isActive: true },
      select: { id: true, displayName: true, username: true, role: true },
      orderBy: { displayName: 'asc' },
    })
    return NextResponse.json({ users })
  } catch (error) {
    console.error('GET /api/community/members error:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}
