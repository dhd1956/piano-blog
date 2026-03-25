import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseEther, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { getDb } from '@/lib/get-db'
import { requireAuth } from '@/lib/auth-middleware'
import { PXP_TOKEN_ADDRESS, REWARD_AMOUNTS } from '@/utils/rewards-contract'

// Minimal Celo Sepolia chain for viem (no wagmi dependency in server code)
const celoSepoliaChain = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: { decimals: 18, name: 'CELO', symbol: 'CELO' },
  rpcUrls: { default: { http: ['https://rpc.ankr.com/celo_sepolia'] } },
} as const

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

const BALANCE_OF_ABI = [
  {
    name: 'balanceOf',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: '_owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const

// Normalise the private key regardless of how it was stored in Vercel:
// strip surrounding quotes, remove all whitespace, strip any 0x prefix,
// then re-attach 0x. Logs the sanitised length so format errors are debuggable.
function normalisePrivateKey(raw: string | undefined): Hex | undefined {
  if (!raw) return undefined
  const cleaned = raw
    .trim()
    .replace(/^["']|["']$/g, '') // strip surrounding quotes
    .replace(/\s+/g, '') // remove any embedded whitespace/newlines
    .replace(/^0x/i, '') // strip 0x prefix (we'll re-add it)
  console.log('[claim-welcome] PRIVATE_KEY sanitised length:', cleaned.length)
  return ('0x' + cleaned) as Hex
}
const PRIVATE_KEY = normalisePrivateKey(process.env.PRIVATE_KEY)

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

    // EOA address from JWT — used for DB deduplication and transfer target
    const address = user.walletAddress.toLowerCase()
    const transferTo: string = user.walletAddress.trim()
    const rpcTransport = http('https://rpc.ankr.com/celo_sepolia', { retryCount: 3 })
    const publicClient = createPublicClient({
      chain: celoSepoliaChain as any,
      transport: rpcTransport,
    })

    // 2. Check DB eligibility and load reward amount from PXPConfig
    const db = await getDb()
    const [dbUser, welcomeConfig] = await Promise.all([
      db.user.findUnique({
        where: { walletAddress: address },
        select: { hasClaimedNewUserReward: true },
      }),
      db.pXPConfig.findUnique({
        where: { key: 'wallet_connection' },
        select: { value: true, enabled: true },
      }),
    ])

    // Use DB config value; fall back to REWARD_AMOUNTS.NEW_USER if missing or disabled
    const rewardAmount =
      welcomeConfig && welcomeConfig.enabled ? welcomeConfig.value : REWARD_AMOUNTS.NEW_USER

    if (dbUser?.hasClaimedNewUserReward) {
      // DB says claimed — verify on-chain balance at the transfer target.
      // If balance > 0 the user genuinely has their PXP; block re-claim.
      // If balance = 0 the previous claim failed silently; reset and proceed.
      const onChainBalance = await publicClient.readContract({
        address: PXP_TOKEN_ADDRESS as `0x${string}`,
        abi: BALANCE_OF_ABI,
        functionName: 'balanceOf',
        args: [transferTo as `0x${string}`],
      })

      if ((onChainBalance as bigint) > BigInt(0)) {
        return NextResponse.json({ error: 'Welcome reward already claimed' }, { status: 409 })
      }

      // Reset the false claim so the transfer below can proceed
      console.log('[claim-welcome] resetting false DB claim for', address)
      await db.user.update({
        where: { walletAddress: address },
        data: {
          hasClaimedNewUserReward: false,
          totalPXPEarned: { decrement: rewardAmount },
        },
      })
    }

    if (!PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Reward distribution is not configured on this server' },
        { status: 503 }
      )
    }

    // Validate key format before calling viem (gives a clearer error than viem's generic throw)
    if (!/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
      console.error(
        '[claim-welcome] PRIVATE_KEY format invalid: length=',
        PRIVATE_KEY.length,
        'starts=',
        PRIVATE_KEY.slice(0, 6)
      )
      return NextResponse.json(
        {
          error: `Server key configuration error (invalid format) — sanitised length: ${PRIVATE_KEY.length}, starts: ${PRIVATE_KEY.slice(0, 6)}`,
        },
        { status: 503 }
      )
    }

    // 3. Transfer PXP from platform hot wallet → user's embedded wallet.
    // Gate on PRIVATE_KEY only — not on whether the *rewards* contract is
    // deployed (PXP_REWARDS_ADDRESS). A direct ERC-20 transfer works even
    // when the rewards contract isn't deployed on this network.
    const account = privateKeyToAccount(PRIVATE_KEY)
    const walletClient = createWalletClient({
      account,
      chain: celoSepoliaChain as any,
      transport: rpcTransport,
    })

    const txHash = await walletClient.writeContract({
      address: PXP_TOKEN_ADDRESS as `0x${string}`,
      abi: TRANSFER_ABI,
      functionName: 'transfer',
      args: [transferTo as `0x${string}`, parseEther(rewardAmount.toString())],
      chain: celoSepoliaChain as any,
      gas: BigInt(100_000),
    })

    // Wait for on-chain confirmation so the balance is readable by the time
    // the client navigates back to TipModal (Celo Sepolia ~5s block time).
    await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      timeout: 60_000,
    })

    // 3b. Send a small CELO gas stipend so the user can pay gas for future
    // transactions (e.g. PXP tips) from their embedded wallet. Non-fatal —
    // the PXP claim succeeds even if this transfer fails.
    // Remove this once Privy smart wallets + Pimlico paymaster are configured.
    try {
      const stipendHash = await walletClient.sendTransaction({
        to: transferTo as `0x${string}`,
        value: parseEther('0.01'),
        chain: celoSepoliaChain as any,
        gas: BigInt(25_000),
      })
      console.log('[claim-welcome] CELO stipend sent:', stipendHash)
    } catch (stipendErr) {
      console.error('[claim-welcome] CELO stipend failed (non-fatal):', stipendErr)
    }

    // 4. Mark as claimed in DB
    await db.user.update({
      where: { walletAddress: address },
      data: {
        hasClaimedNewUserReward: true,
        totalPXPEarned: { increment: rewardAmount },
      },
    })

    return NextResponse.json({ success: true, hash: txHash, amount: rewardAmount })
  } catch (error: any) {
    console.error('[claim-welcome] Error:', error)
    return NextResponse.json(
      { error: error.shortMessage || error.message || 'Failed to distribute reward' },
      { status: 500 }
    )
  }
}
