import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'

/**
 * API Route: Mark onboarding as complete
 * POST /api/onboarding/complete
 *
 * Body: {
 *   userId: number
 *   interests: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, interests } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const db = await getDb()

    // Mark onboarding as complete
    await db.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
        onboardingStep: null, // Clear step since it's complete
        userInterests: interests || [],
        lastOnboardingNudge: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
