import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * API Route: Save onboarding progress
 * POST /api/onboarding/progress
 *
 * Body: {
 *   userId: number
 *   step: number
 *   completed: boolean
 *   interests?: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, step, completed, interests } = await request.json()

    if (!userId || !step) {
      return NextResponse.json({ error: 'userId and step are required' }, { status: 400 })
    }

    // Update user onboarding progress
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStep: step,
        onboardingCompleted: completed,
        ...(interests && interests.length > 0 && { userInterests: interests }),
        lastOnboardingNudge: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving onboarding progress:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save onboarding progress' },
      { status: 500 }
    )
  }
}
