/**
 * Add Email to Wallet Account API
 *
 * POST /api/auth/add-email - Add email to wallet-only account
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { createEmailVerificationToken } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import { z } from 'zod'

const addEmailSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = addEmailSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { walletAddress, email } = validation.data
    const normalizedAddress = walletAddress.toLowerCase()
    const db = await getDb()

    // Find user by wallet address
    const user = await db.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        username: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has an email
    if (user.email) {
      return NextResponse.json(
        { error: 'This account already has an email address. Use account settings to change it.' },
        { status: 400 }
      )
    }

    // Check if email is already used by another account
    const existingEmail = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
      },
    })

    if (existingEmail) {
      // If same user, no need to do anything
      if (existingEmail.id === user.id) {
        return NextResponse.json(
          { error: 'This email is already associated with your account' },
          { status: 400 }
        )
      }

      // Different user - suggest account merging
      return NextResponse.json(
        {
          error: 'Email already in use by another account',
          suggestMerge: true,
          existingAccount: {
            id: existingEmail.id,
            walletAddress: existingEmail.walletAddress,
            username: existingEmail.username,
            displayName: existingEmail.displayName,
          },
        },
        { status: 409 }
      )
    }

    // Update user with email
    await db.user.update({
      where: { id: user.id },
      data: {
        email,
        emailAddedAt: new Date(),
        emailVerified: false, // Needs verification
      },
    })

    // Generate verification token
    const verificationToken = await createEmailVerificationToken(user.id)

    // Send verification email
    const emailResult = await sendVerificationEmail(
      email,
      verificationToken,
      user.username || undefined
    )

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      // Don't fail the request - email was added successfully
      return NextResponse.json({
        success: true,
        message:
          'Email added but verification email failed to send. Please request a new verification email.',
        emailSent: false,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Email added successfully. Please check your inbox to verify your email.',
      emailSent: true,
    })
  } catch (error) {
    console.error('Add email error:', error)
    return NextResponse.json({ error: 'An error occurred while adding email' }, { status: 500 })
  }
}
