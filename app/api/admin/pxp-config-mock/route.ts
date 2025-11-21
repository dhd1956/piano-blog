import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-middleware'

// GET /api/admin/pxp-config-mock - Fetch mock PXP reward configuration (for testing when RPC is slow)
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is BLOG_OWNER
    const authResult = await requireRole(request, ['BLOG_OWNER'])
    if (authResult instanceof NextResponse) {
      return authResult // Return error response if not authorized
    }

    // Return mock data (since Celo testnet RPC is timing out)
    return NextResponse.json({
      success: true,
      mode: 'mock',
      note: 'Using mock data because Celo Alfajores RPC is unreachable',
      rewards: {
        newUser: 25,
        scout: 50,
        verifier: 25,
      },
      limits: {
        min: 1,
        max: 1000,
      },
      contractBalance: '10000', // Mock balance
      contractAddress:
        process.env.NEXT_PUBLIC_PXP_REWARDS_ADDRESS || '0x79cC4705739c42628Ac93523AAaCe023B9520d38',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching mock PXP config:', error)
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

// POST /api/admin/pxp-config-mock - Update PXP reward amounts (mock mode)
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and is BLOG_OWNER
    const authResult = await requireRole(request, ['BLOG_OWNER'])
    if (authResult instanceof NextResponse) {
      return authResult // Return error response if not authorized
    }

    const body = await request.json()
    const { newUser, scout, verifier, walletAddress } = body

    // Validation
    if (!newUser || !scout || !verifier) {
      return NextResponse.json({ error: 'Missing required reward amounts' }, { status: 400 })
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required for transaction signing' },
        { status: 400 }
      )
    }

    // Validate amounts are within limits
    const min = 1
    const max = 1000

    if (newUser < min || newUser > max) {
      return NextResponse.json(
        { error: `New user reward must be between ${min} and ${max} PXP` },
        { status: 400 }
      )
    }
    if (scout < min || scout > max) {
      return NextResponse.json(
        { error: `Scout reward must be between ${min} and ${max} PXP` },
        { status: 400 }
      )
    }
    if (verifier < min || verifier > max) {
      return NextResponse.json(
        { error: `Verifier reward must be between ${min} and ${max} PXP` },
        { status: 400 }
      )
    }

    // Return mock transaction data
    return NextResponse.json({
      success: true,
      mode: 'mock',
      message: 'Validation successful (mock mode - no real transaction)',
      note: 'In production, this would return real transaction data to sign',
      transaction: {
        to: process.env.NEXT_PUBLIC_PXP_REWARDS_ADDRESS,
        data: '0xmocktransactiondata',
        from: walletAddress,
      },
      rewards: {
        newUser,
        scout,
        verifier,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error preparing mock PXP config update:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to prepare configuration update',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
