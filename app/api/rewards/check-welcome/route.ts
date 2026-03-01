import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { checkWelcomeRewardEligibility } from '@/utils/rewards-contract'
import { getDb } from '@/lib/get-db'
import { PXP_TOKEN_ADDRESS, REWARD_AMOUNTS } from '@/utils/rewards-contract'

const celoSepoliaChain = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: { decimals: 18, name: 'CELO', symbol: 'CELO' },
  rpcUrls: { default: { http: ['https://rpc.ankr.com/celo_sepolia'] } },
} as const

const BALANCE_OF_ABI = [
  {
    name: 'balanceOf',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: '_owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const

/**
 * API Route: Check if user is eligible for welcome reward
 * GET /api/rewards/check-welcome?address=0x...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    const db = await getDb()

    // Check database first
    const user = await db.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
      select: { hasClaimedNewUserReward: true },
    })

    if (user?.hasClaimedNewUserReward) {
      // Secondary check: verify on-chain PXP balance.
      // If balance is 0 the previous claim failed silently (e.g. isDevelopment
      // gate skipped the transfer but still marked DB as claimed). Allow re-claim.
      try {
        const publicClient = createPublicClient({
          chain: celoSepoliaChain as any,
          transport: http('https://rpc.ankr.com/celo_sepolia'),
        })
        const balance = await publicClient.readContract({
          address: PXP_TOKEN_ADDRESS as `0x${string}`,
          abi: BALANCE_OF_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        })
        if ((balance as bigint) === BigInt(0)) {
          console.log(
            '[check-welcome] DB says claimed but on-chain balance is 0 — allowing re-claim for',
            address
          )
          return NextResponse.json({
            eligible: true,
            amount: REWARD_AMOUNTS.NEW_USER,
            message: 'Previous claim did not complete — please claim again',
          })
        }
      } catch (balanceErr) {
        console.warn('[check-welcome] could not verify on-chain balance:', balanceErr)
      }

      return NextResponse.json({
        eligible: false,
        amount: 0,
        message: 'Welcome reward already claimed',
        claimedInDb: true,
      })
    }

    // Check blockchain eligibility
    const eligibility = await checkWelcomeRewardEligibility(address)

    return NextResponse.json(eligibility)
  } catch (error: any) {
    console.error('Error checking welcome reward:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check reward eligibility' },
      { status: 500 }
    )
  }
}
