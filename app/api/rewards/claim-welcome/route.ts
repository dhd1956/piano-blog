import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, http, parseEther, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { getDb } from '@/lib/get-db'
import { requireAuth } from '@/lib/auth-middleware'
import { PXP_TOKEN_ADDRESS, PXP_REWARDS_ADDRESS, REWARD_AMOUNTS } from '@/utils/rewards-contract'

// Minimal Celo Sepolia chain for viem (no wagmi dependency in server code)
const celoSepoliaChain = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: { decimals: 18, name: 'CELO', symbol: 'CELO' },
  rpcUrls: { default: { http: ['https://rpc.ankr.com/celo_sepolia'] } },
} as const

// Minimal ERC-20 transfer ABI for viem
const TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex | undefined
const isDevelopment = PXP_REWARDS_ADDRESS === '0x0000000000000000000000000000000000000000'

/**
 * POST /api/rewards/claim-welcome
 *
 * Server-side reward distribution: transfers 25 PXP from the platform hot
 * wallet directly to the user's embedded wallet address, then marks the
 * claim in the database. This avoids the embedded-wallet gas problem
 * (embedded wallets start with 0 CELO, so they can't pay gas themselves).
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate — address comes from the JWT, not the client body
    const authResult = await requireAuth(request as any)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    if (!user.walletAddress) {
      return NextResponse.json({ error: 'No wallet address on account' }, { status: 400 })
    }

    const address = user.walletAddress.toLowerCase()

    // 2. Check DB eligibility (fast path — avoids RPC call)
    const db = await getDb()
    const dbUser = await db.user.findUnique({
      where: { walletAddress: address },
      select: { hasClaimedNewUserReward: true },
    })

    if (dbUser?.hasClaimedNewUserReward) {
      return NextResponse.json({ error: 'Welcome reward already claimed' }, { status: 409 })
    }

    let txHash: string | undefined

    if (!isDevelopment && PRIVATE_KEY) {
      // 3. Transfer PXP from platform hot wallet → user's embedded wallet
      const account = privateKeyToAccount(PRIVATE_KEY)
      const walletClient = createWalletClient({
        account,
        chain: celoSepoliaChain as any,
        transport: http('https://rpc.ankr.com/celo_sepolia', { retryCount: 3 }),
      })

      txHash = await walletClient.writeContract({
        address: PXP_TOKEN_ADDRESS as `0x${string}`,
        abi: TRANSFER_ABI,
        functionName: 'transfer',
        args: [user.walletAddress as `0x${string}`, parseEther(REWARD_AMOUNTS.NEW_USER.toString())],
        chain: celoSepoliaChain as any,
      })
    } else {
      // Development / no PRIVATE_KEY: DB-only (no on-chain transfer)
      console.log('[claim-welcome] dev mode — skipping on-chain transfer')
    }

    // 4. Mark as claimed in DB
    await db.user.update({
      where: { walletAddress: address },
      data: {
        hasClaimedNewUserReward: true,
        totalCAVEarned: { increment: REWARD_AMOUNTS.NEW_USER },
      },
    })

    return NextResponse.json({
      success: true,
      hash: txHash,
      amount: REWARD_AMOUNTS.NEW_USER,
    })
  } catch (error: any) {
    console.error('[claim-welcome] Error:', error)
    return NextResponse.json(
      { error: error.shortMessage || error.message || 'Failed to distribute reward' },
      { status: 500 }
    )
  }
}
