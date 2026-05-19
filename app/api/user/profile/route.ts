import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { getSessionUser } from '@/lib/auth-middleware'

/**
 * API Route: Update user profile
 * PATCH /api/user/profile
 *
 * Body: {
 *   displayName?: string
 *   location?: string
 *   bio?: string
 *   email?: string
 *   avatar?: string
 *   title?: string
 *   skills?: string[]
 *   socialLinks?: object
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get the authenticated user (if using auth middleware)
    // For now, we'll accept userId in the body or from session
    const body = await request.json()
    const {
      userId,
      displayName,
      location,
      province,
      country,
      bio,
      email,
      avatar,
      title,
      skills,
      socialLinks,
    } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Build update data object (only include provided fields)
    const updateData: any = {}
    if (displayName !== undefined) updateData.displayName = displayName
    if (location !== undefined) updateData.location = location
    if (province !== undefined) updateData.province = province
    if (country !== undefined) updateData.country = country
    if (bio !== undefined) updateData.bio = bio
    if (email !== undefined) updateData.email = email
    if (avatar !== undefined) updateData.avatar = avatar
    if (title !== undefined) updateData.title = title
    if (skills !== undefined) updateData.skills = skills
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks

    // Update user profile
    const db = await getDb()
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
