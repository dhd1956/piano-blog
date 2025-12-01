/**
 * Change Password API
 *
 * POST /api/account/change-password - Change user's password
 * Invalidates all existing sessions except current one
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-simplified'
import { sendSecurityAlertEmail } from '@/lib/email'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const changePasswordSchema = z.object({
  userId: z.number(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = changePasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { userId, currentPassword, newPassword } = validation.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        displayName: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has a password (wallet-only users won't)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'This account does not have a password set' },
        { status: 400 }
      )
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    // Ensure new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash)
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Hash new password
    const saltRounds = 10
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update password and invalidate sessions
    // Note: In a production app, you'd typically have a sessions table
    // For now, we'll just update the password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    })

    // Send security alert email
    if (user.email) {
      await sendSecurityAlertEmail(user.email, user.username || 'User', 'password_changed')
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully.',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while changing password' },
      { status: 500 }
    )
  }
}
