/**
 * User Registration API Route
 * Allows new users to create accounts with username/password
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-simplified'
import { hashPassword, generateToken, createEmailVerificationToken } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

const signupSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'Username can only contain letters, numbers, hyphens, and underscores',
    })
    .transform((val) => val.toLowerCase()), // Normalize to lowercase for case-insensitive usernames
  password: z.string().min(6),
  email: z.string().email().optional(),
  displayName: z.string().max(100).optional(),
  referralCode: z.string().optional(), // Referral code from inviter
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = signupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Please check your input',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { username, password, email, displayName, referralCode } = validation.data

    // Preserve original username case for displayName if not provided
    const originalUsername = body.username // Original case before transform
    const finalDisplayName = displayName || originalUsername

    // Validate referral code if provided
    let referrer: { id: number; referralCode: string | null; displayName: string | null } | null =
      null
    if (referralCode) {
      referrer = await prisma.user.findUnique({
        where: { referralCode },
        select: { id: true, referralCode: true, displayName: true },
      })

      if (!referrer) {
        console.warn(`Invalid referral code provided: ${referralCode}`)
        // Don't fail signup - just ignore invalid referral code
      }
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUsername) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username taken',
          message: `Username "${username}" is already taken. Please choose another.`,
        },
        { status: 400 }
      )
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already registered',
            message: `This email is already registered. Please log in or use a different email.`,
          },
          { status: 400 }
        )
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user with referral tracking
    const newUser = await prisma.user.create({
      data: {
        username, // Normalized to lowercase
        passwordHash,
        email,
        displayName: finalDisplayName, // Preserves original case
        role: UserRole.SCOUT, // Default role for new users
        isActive: true,
        publicProfile: true, // Default to public profile
        showPXPBalance: true, // Default to showing PXP balance
        referredBy: referrer?.referralCode, // Link to referrer
      },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        role: true,
        email: true,
        displayName: true,
      },
    })

    // Update referrer's stats if this was a referral signup
    if (referrer) {
      await prisma.user.update({
        where: { id: referrer.id },
        data: {
          referralCount: { increment: 1 },
        },
      })
      console.log(`✓ Referral tracked: ${newUser.username} referred by ${referrer.displayName}`)
    }

    // Generate JWT token
    const token = await generateToken(newUser)

    // Send verification email if email was provided
    let emailSent = false
    if (email) {
      try {
        const verificationToken = await createEmailVerificationToken(newUser.id)
        const emailResult = await sendVerificationEmail(email, verificationToken, username)
        emailSent = emailResult.success

        if (!emailSent) {
          console.warn(`Failed to send verification email to ${email}`)
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Don't fail signup if email fails - just log it
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: email
          ? 'Account created successfully. Please check your email to verify your account.'
          : 'Account created successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          walletAddress: newUser.walletAddress,
          role: newUser.role,
          displayName: newUser.displayName,
          emailVerified: false,
        },
        token,
        emailSent,
      },
      {
        status: 201,
        headers: {
          'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
        },
      }
    )
  } catch (error: any) {
    console.error('Signup error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed',
        message: error.message || 'An error occurred during registration',
      },
      { status: 500 }
    )
  }
}
