import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-middleware'
import Web3 from 'web3'
import { PXP_REWARDS_ABI, PXP_REWARDS_ADDRESS, CELO_TESTNET_RPC } from '@/utils/rewards-contract'

// GET /api/admin/pxp-config - Fetch current PXP reward configuration
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is BLOG_OWNER
    const authResult = await requireRole(request, ['BLOG_OWNER'])
    if (authResult instanceof NextResponse) {
      return authResult // Return error response if not authorized
    }

    // Connect to smart contract
    const web3 = new Web3(CELO_TESTNET_RPC)
    const contract = new web3.eth.Contract(PXP_REWARDS_ABI as any, PXP_REWARDS_ADDRESS)

    // Get all reward amounts from contract
    const rewards = await contract.methods.getAllRewards().call()

    // Get reward limits
    const limits = await contract.methods.getRewardLimits().call()

    // Get contract balance
    const contractBalance = await contract.methods.getContractBalance().call()

    return NextResponse.json({
      success: true,
      rewards: {
        newUser: Number(rewards.newUser),
        scout: Number(rewards.scout),
        verifier: Number(rewards.verifier),
      },
      limits: {
        min: Number(limits.min),
        max: Number(limits.max),
      },
      contractBalance: web3.utils.fromWei(contractBalance.toString(), 'ether'),
      contractAddress: PXP_REWARDS_ADDRESS,
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

// POST /api/admin/pxp-config - Update PXP reward amounts (via smart contract)
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

    // Connect to smart contract
    const web3 = new Web3(CELO_TESTNET_RPC)
    const contract = new web3.eth.Contract(PXP_REWARDS_ABI as any, PXP_REWARDS_ADDRESS)

    // Get reward limits for validation
    const limits = await contract.methods.getRewardLimits().call()
    const min = Number(limits.min)
    const max = Number(limits.max)

    // Validate amounts are within limits
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

    // Return transaction data for frontend to execute
    // (Frontend will call setAllRewards via MetaMask)
    const txData = contract.methods.setAllRewards(newUser, scout, verifier).encodeABI()

    return NextResponse.json({
      success: true,
      message: 'Validation successful',
      transaction: {
        to: PXP_REWARDS_ADDRESS,
        data: txData,
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
    console.error('Error preparing PXP config update:', error)
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
