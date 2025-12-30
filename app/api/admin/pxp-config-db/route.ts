/**
 * PXP Database Configuration API
 * Manage database-tracked PXP reward amounts (referrals, YouTube, events)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requireRole } from '@/lib/auth-middleware'

/**
 * GET /api/admin/pxp-config-db
 * Fetch all database-tracked PXP configuration values
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is admin
    const authResult = await requireRole(request, ['BLOG_OWNER'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Fetch all PXP config
    const configs = await prisma.pXPConfig.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    })

    // Group by category for easier UI rendering
    const groupedConfigs = configs.reduce(
      (acc, config) => {
        if (!acc[config.category]) {
          acc[config.category] = []
        }
        acc[config.category].push(config)
        return acc
      },
      {} as Record<string, typeof configs>
    )

    return NextResponse.json({
      success: true,
      configs,
      groupedConfigs,
      categories: Object.keys(groupedConfigs),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching PXP config:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch PXP configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/pxp-config-db
 * Update PXP configuration values (bulk update)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and is admin
    const authResult = await requireRole(request, ['BLOG_OWNER'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const { updates } = body as {
      updates: Array<{ key: string; value: number; enabled?: boolean }>
    }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request body - updates array required' },
        {
          status: 400,
        }
      )
    }

    // Validate PXP amounts (must be positive)
    for (const update of updates) {
      if (update.value < 0) {
        return NextResponse.json(
          { error: `PXP value must be positive for key: ${update.key}` },
          { status: 400 }
        )
      }
      if (update.value > 10000) {
        return NextResponse.json(
          { error: `PXP value too high (max 10,000) for key: ${update.key}` },
          { status: 400 }
        )
      }
    }

    // Update all configs in a transaction
    const results = await prisma.$transaction(
      updates.map((update) =>
        prisma.pXPConfig.update({
          where: { key: update.key },
          data: {
            value: update.value,
            enabled: update.enabled ?? true,
            updatedBy:
              authResult.user?.walletAddress || authResult.user?.username || 'unknown-admin',
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      updated: results.length,
      configs: results,
      message: `Successfully updated ${results.length} reward configurations`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error updating PXP config:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update PXP configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/pxp-config-db
 * Create or update a single configuration entry
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify user is authenticated and is admin
    const authResult = await requireRole(request, ['BLOG_OWNER'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const { key, value, label, description, category, enabled } = body

    if (!key || value === undefined || !label || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: key, value, label, category' },
        { status: 400 }
      )
    }

    // Upsert the config
    const config = await prisma.pXPConfig.upsert({
      where: { key },
      create: {
        key,
        value,
        label,
        description,
        category,
        enabled: enabled ?? true,
        updatedBy: authResult.user?.walletAddress || authResult.user?.username || 'unknown-admin',
      },
      update: {
        value,
        label,
        description,
        category,
        enabled: enabled ?? true,
        updatedBy: authResult.user?.walletAddress || authResult.user?.username || 'unknown-admin',
      },
    })

    return NextResponse.json({
      success: true,
      config,
      message: `Configuration ${key} saved successfully`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error upserting PXP config:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save PXP configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
