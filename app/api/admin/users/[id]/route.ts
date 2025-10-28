/**
 * Admin User Management API - Single User
 * Blog owner can update or delete users
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database-simplified'
import { requireRole, can } from '@/lib/auth-middleware'
import { hashPassword } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

const updateUserSchema = z.object({
  password: z.string().min(6).optional(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  isActive: z.boolean().optional(),
  role: z.enum([UserRole.CURATOR, UserRole.VALIDATOR, UserRole.SCOUT]).optional(),
})

/**
 * GET /api/admin/users/[id]
 * Get single user details
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user ID',
        },
        { status: 400 }
      )
    }

    // Require BLOG_OWNER role
    const authResult = await requireRole(request as any, [UserRole.BLOG_OWNER])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user: authUser } = authResult

    if (!can.manageUsers(authUser)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
        },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        _count: {
          select: {
            validations: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error: any) {
    console.error('Get user error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user',
        message: error.message || 'An error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user (Blog owner only)
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user ID',
        },
        { status: 400 }
      )
    }

    // Require BLOG_OWNER role
    const authResult = await requireRole(request as any, [UserRole.BLOG_OWNER])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user: authUser } = authResult

    if (!can.manageUsers(authUser)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = updateUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { password, email, displayName, isActive, role } = validation.data

    // Build update data
    const updateData: any = {}

    if (password) {
      updateData.passwordHash = await hashPassword(password)
    }

    if (email !== undefined) {
      updateData.email = email
    }

    if (displayName !== undefined) {
      updateData.displayName = displayName
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    if (role !== undefined) {
      updateData.role = role
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        displayName: true,
        isActive: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('Update user error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user',
        message: error.message || 'An error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user (Blog owner only)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user ID',
        },
        { status: 400 }
      )
    }

    // Require BLOG_OWNER role
    const authResult = await requireRole(request as any, [UserRole.BLOG_OWNER])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user: authUser } = authResult

    if (!can.manageUsers(authUser)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
        },
        { status: 403 }
      )
    }

    // Cannot delete yourself
    if (authUser.id === userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete yourself',
        },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete user error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete user',
        message: error.message || 'An error occurred',
      },
      { status: 500 }
    )
  }
}
