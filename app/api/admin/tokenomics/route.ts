/**
 * GET /api/admin/tokenomics
 *
 * Returns:
 * - On-chain: totalSupply, totalBurned (V3 contract), contract balance
 * - DB: sum of totalPXPEarned across all users, total tips recorded
 * - Per-user reconciliation: db_earned vs on_chain_balance for all wallet users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, formatEther } from 'viem'
import { requireRole } from '@/lib/auth-middleware'
import { getDb } from '@/lib/get-db'
import {
  PXP_TOKEN_ADDRESS,
  PXP_REWARDS_ADDRESS,
  ERC20_ABI,
  PXP_REWARDS_ABI,
} from '@/utils/rewards-contract'

const celoSepolia = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: { decimals: 18, name: 'CELO', symbol: 'CELO' },
  rpcUrls: { default: { http: ['https://rpc.ankr.com/celo_sepolia'] } },
} as const

const publicClient = createPublicClient({
  chain: celoSepolia,
  transport: http(),
})

const BALANCE_OF_ABI = [
  {
    name: 'balanceOf',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const TOTAL_SUPPLY_ABI = [
  {
    name: 'totalSupply',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const TOTAL_BURNED_ABI = [
  {
    name: 'totalBurned',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['BLOG_OWNER'])
    if (authResult instanceof NextResponse) return authResult

    const db = await getDb()

    // ── DB aggregate stats ──────────────────────────────────────────────
    const [userAgg, tipAgg, users] = await Promise.all([
      db.user.aggregate({
        _sum: { totalPXPEarned: true },
        _count: { walletAddress: true },
      }),
      db.pXPPayment.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { paymentType: 'tip', status: 'CONFIRMED' },
      }),
      db.user.findMany({
        where: { walletAddress: { not: null } },
        select: {
          id: true,
          walletAddress: true,
          displayName: true,
          username: true,
          totalPXPEarned: true,
          role: true,
        },
        orderBy: { totalPXPEarned: 'desc' },
        take: 100, // cap at 100 for RPC batch size
      }),
    ])

    // ── On-chain: totalSupply + totalBurned + contract balance ──────────
    const [totalSupplyRaw, totalBurnedRaw, contractBalanceRaw] = await Promise.all([
      publicClient.readContract({
        address: PXP_TOKEN_ADDRESS as `0x${string}`,
        abi: TOTAL_SUPPLY_ABI,
        functionName: 'totalSupply',
      }),
      publicClient.readContract({
        address: PXP_REWARDS_ADDRESS as `0x${string}`,
        abi: TOTAL_BURNED_ABI,
        functionName: 'totalBurned',
      }),
      publicClient.readContract({
        address: PXP_TOKEN_ADDRESS as `0x${string}`,
        abi: BALANCE_OF_ABI,
        functionName: 'balanceOf',
        args: [PXP_REWARDS_ADDRESS as `0x${string}`],
      }),
    ])

    // ── Per-user on-chain balances via multicall ────────────────────────
    const walletUsers = users.filter((u) => u.walletAddress)

    let onChainBalances: bigint[] = []
    if (walletUsers.length > 0) {
      const calls = walletUsers.map((u) => ({
        address: PXP_TOKEN_ADDRESS as `0x${string}`,
        abi: BALANCE_OF_ABI,
        functionName: 'balanceOf' as const,
        args: [u.walletAddress as `0x${string}`],
      }))

      const results = await publicClient.multicall({ contracts: calls, allowFailure: true })
      onChainBalances = results.map((r) =>
        r.status === 'success' ? (r.result as bigint) : BigInt(0)
      )
    }

    // ── Build reconciliation rows ───────────────────────────────────────
    const reconciliation = walletUsers.map((u, i) => {
      const onChain = parseFloat(formatEther(onChainBalances[i] ?? BigInt(0)))
      const dbEarned = u.totalPXPEarned
      const drift = onChain - dbEarned // positive = chain has MORE than DB recorded (error)
      return {
        id: u.id,
        walletAddress: u.walletAddress,
        displayName: u.displayName || u.username,
        role: u.role,
        dbEarned,
        onChainBalance: onChain,
        drift,
        flag: drift > 0.01, // chain balance exceeds recorded earnings — shouldn't happen
      }
    })

    const flaggedCount = reconciliation.filter((r) => r.flag).length

    return NextResponse.json({
      success: true,
      chain: {
        totalSupply: parseFloat(formatEther(totalSupplyRaw as bigint)),
        totalBurned: parseFloat(formatEther(totalBurnedRaw as bigint)),
        contractBalance: parseFloat(formatEther(contractBalanceRaw as bigint)),
        circulatingSupply:
          parseFloat(formatEther(totalSupplyRaw as bigint)) -
          parseFloat(formatEther(contractBalanceRaw as bigint)),
      },
      db: {
        totalEarnedRecorded: userAgg._sum.totalPXPEarned ?? 0,
        usersWithWallet: userAgg._count.walletAddress,
        totalTipsAmount: tipAgg._sum.amount ?? 0,
        totalTipsCount: tipAgg._count.id,
      },
      reconciliation,
      flaggedCount,
    })
  } catch (error: any) {
    console.error('GET /api/admin/tokenomics error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
