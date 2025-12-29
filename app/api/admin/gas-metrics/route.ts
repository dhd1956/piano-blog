import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-middleware'
import prisma from '@/lib/prisma'

// Gas metrics interface (matches dashboard)
interface GasMetrics {
  isEnabled: boolean
  totalTransactionsToday: number
  totalTransactionsWeek: number
  totalTransactionsMonth: number
  costToday: number
  costWeek: number
  costMonth: number
  paymasterBalance: number
  transactionsByType: Record<string, number>
  topUsers: Array<{
    userId: number
    username: string
    transactionCount: number
    estimatedCost: number
  }>
  budgetStatus: {
    dailyLimit: number
    monthlyLimit: number
    dailyUsed: number
    monthlyUsed: number
    alertThreshold: number
  }
}

/**
 * GET /api/admin/gas-metrics
 *
 * Returns gas sponsorship metrics for the admin dashboard.
 *
 * Authorization: Admin only
 *
 * Response:
 * - isEnabled: Whether gas sponsorship is active (based on NEXT_PUBLIC_PAYMASTER_URL)
 * - Transaction counts and costs (today/week/month)
 * - Paymaster balance
 * - Breakdown by transaction type
 * - Top users by gas consumption
 * - Budget status and limits
 *
 * Note: Currently returns demo data. In production with Pimlico active,
 * this will fetch real metrics from:
 * - Pimlico API for costs and balance
 * - Database for transaction counts and user activity
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, role: true },
    })

    // Check if user is blog owner
    if (!user || user.role !== 'BLOG_OWNER') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Check if gas sponsorship is enabled
    const isEnabled = !!process.env.NEXT_PUBLIC_PAYMASTER_URL

    // TODO: When gas sponsorship is active, fetch real data from:
    // 1. Pimlico API - paymasterBalance, actual costs
    // 2. Database - transaction counts, user activity
    // 3. Local tracking - rate limit usage
    //
    // For now, return demo/placeholder data
    const metrics: GasMetrics = await getGasMetrics(isEnabled)

    return NextResponse.json(metrics, { status: 200 })
  } catch (error) {
    console.error('Error fetching gas metrics:', error)
    return NextResponse.json({ error: 'Failed to fetch gas metrics' }, { status: 500 })
  }
}

/**
 * Fetch gas metrics from database and external services
 *
 * @param isEnabled - Whether gas sponsorship is currently enabled
 * @returns Gas metrics object
 */
async function getGasMetrics(isEnabled: boolean): Promise<GasMetrics> {
  // If gas sponsorship is not enabled, return demo data
  if (!isEnabled) {
    return getDemoMetrics()
  }

  // TODO: When gas sponsorship is active, implement:
  // 1. Fetch paymaster balance from Pimlico API
  // 2. Query database for transaction counts (today/week/month)
  // 3. Calculate costs based on transaction gas usage
  // 4. Get top users from transaction logs
  // 5. Check budget limits from config
  //
  // Example Pimlico API call:
  // const balance = await fetch(
  //   `${process.env.NEXT_PUBLIC_PAYMASTER_URL}/balance`,
  //   {
  //     headers: {
  //       'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`
  //     }
  //   }
  // )

  // For now, return demo data even when enabled
  // (until we have real transaction tracking in database)
  return getDemoMetrics()
}

/**
 * Get demo metrics for development/testing
 * Shows realistic sample data when gas sponsorship is not active
 */
function getDemoMetrics(): GasMetrics {
  const isEnabled = !!process.env.NEXT_PUBLIC_PAYMASTER_URL

  return {
    isEnabled,
    totalTransactionsToday: isEnabled ? 0 : 12,
    totalTransactionsWeek: isEnabled ? 0 : 78,
    totalTransactionsMonth: isEnabled ? 0 : 324,
    costToday: isEnabled ? 0 : 0.18,
    costWeek: isEnabled ? 0 : 1.24,
    costMonth: isEnabled ? 0 : 5.87,
    paymasterBalance: isEnabled ? 0 : 94.13,
    transactionsByType: {
      submitVenue: 145,
      rsvpToEvent: 89,
      updateProfile: 54,
      createEvent: 24,
      verifyVenue: 12,
    },
    topUsers: [
      {
        userId: 1,
        username: 'daved',
        transactionCount: 45,
        estimatedCost: 0.68,
      },
      {
        userId: 2,
        username: 'scout_alice',
        transactionCount: 32,
        estimatedCost: 0.51,
      },
      {
        userId: 3,
        username: 'curator_bob',
        transactionCount: 28,
        estimatedCost: 0.42,
      },
    ],
    budgetStatus: {
      dailyLimit: 10,
      monthlyLimit: 300,
      dailyUsed: 0.18,
      monthlyUsed: 5.87,
      alertThreshold: 0.75,
    },
  }
}
