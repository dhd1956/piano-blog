/**
 * Change Email API
 *
 * POST /api/account/change-email - Change user's email address
 * Requires verification of both old and new email addresses
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { createEmailVerificationToken } from '@/lib/auth'
import { sendVerificationEmail, sendSecurityAlertEmail } from '@/lib/email'
import { z } from 'zod'

const changeEmailSchema = z.object({
  userId: z.number(),
  newEmail: z.string().email(),
  currentEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = changeEmailSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { userId, newEmail, currentEmail } = validation.data
    const db = await getDb()

    // Find user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current email matches (if user has one)
    if (user.email && user.email !== currentEmail) {
      return NextResponse.json({ error: 'Current email does not match' }, { status: 400 })
    }

    // Check if new email is already in use
    const existingEmail = await db.user.findUnique({
      where: { email: newEmail },
      select: {
        id: true,
        username: true,
        displayName: true,
      },
    })

    if (existingEmail) {
      if (existingEmail.id === user.id) {
        return NextResponse.json({ error: 'This is already your email address' }, { status: 400 })
      }

      return NextResponse.json(
        {
          error: 'Email already in use by another account',
          suggestMerge: true,
          existingAccount: {
            username: existingEmail.username,
            displayName: existingEmail.displayName,
          },
        },
        { status: 409 }
      )
    }

    // Update email and mark as unverified
    await db.user.update({
      where: { id: user.id },
      data: {
        email: newEmail,
        emailVerified: false,
        emailVerifiedAt: null,
        emailAddedAt: new Date(),
      },
    })

    // Generate verification token for new email
    const verificationToken = await createEmailVerificationToken(user.id)

    // Send verification email to new address
    const emailResult = await sendVerificationEmail(
      newEmail,
      verificationToken,
      user.username || undefined
    )

    // Send security alert to old email (if exists)
    if (currentEmail) {
      await sendSecurityAlertEmail(currentEmail, user.username || 'User', 'email_changed')
    }

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      return NextResponse.json({
        success: true,
        message:
          'Email changed but verification email failed to send. Please request a new verification email.',
        emailSent: false,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Email changed successfully. Please check your inbox to verify your new email.',
      emailSent: true,
    })
  } catch (error) {
    console.error('Change email error:', error)
    return NextResponse.json({ error: 'An error occurred while changing email' }, { status: 500 })
  }
}
