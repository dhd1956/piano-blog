/**
 * Admin User Management API
 * Blog owner can create, list, and manage users
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-simplified'
import { requireRole, can } from '@/lib/auth-middleware'
import { hashPassword } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

const createUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .transform((val) => val.toLowerCase()), // Normalize to lowercase
  password: z.string().min(6),
  role: z.enum([UserRole.CURATOR, UserRole.VALIDATOR, UserRole.SCOUT]),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
})

/**
 * GET /api/admin/users
 * List all users (Blog owner only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require BLOG_OWNER role
    const authResult = await requireRole(request as any, [UserRole.BLOG_OWNER])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    if (!can.manageUsers(user)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Only blog owner can manage users',
        },
        { status: 403 }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        walletAddress: true,
        role: true,
        email: true,
        displayName: true,
        isActive: true,
        createdBy: true,
        createdAt: true,
        lastActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error: any) {
    console.error('List users error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list users',
        message: error.message || 'An error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users
 * Create a new user (Blog owner only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require BLOG_OWNER role
    const authResult = await requireRole(request as any, [UserRole.BLOG_OWNER])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    if (!can.manageUsers(user)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Only blog owner can create users',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { username, password, role, email, displayName } = validation.data

    // Preserve original username case for displayName if not provided
    const originalUsername = body.username
    const finalDisplayName = displayName || originalUsername

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username already exists',
          message: `Username "${username}" is already taken`,
        },
        { status: 400 }
      )
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already exists',
            message: `Email "${email}" is already registered`,
          },
          { status: 400 }
        )
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username, // Normalized to lowercase
        passwordHash,
        role,
        email,
        displayName: finalDisplayName, // Preserves original case
        createdBy: user.username || user.walletAddress || 'blog-owner',
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        displayName: true,
        createdBy: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: newUser,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create user error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
        message: error.message || 'An error occurred',
      },
      { status: 500 }
    )
  }
}
