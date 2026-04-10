import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { PXP_TOKEN_ADDRESS } from '@/utils/rewards-contract'

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

// Normalise the private key regardless of how it was stored in Vercel:
// strip surrounding quotes, remove all whitespace, strip any 0x prefix,
// then re-attach 0x.
function normalisePrivateKey(raw: string | undefined): Hex | undefined {
  if (!raw) return undefined
  const cleaned = raw
    .trim()
    .replace(/^["']|["']$/g, '') // strip surrounding quotes
    .replace(/\s+/g, '') // remove any embedded whitespace/newlines
    .replace(/^0x/i, '') // strip 0x prefix (we'll re-add it)
  return ('0x' + cleaned) as Hex
}

const PRIVATE_KEY = normalisePrivateKey(process.env.PRIVATE_KEY)

/**
 * Send PXP tokens from the platform hot wallet to a user's address.
 *
 * Non-fatal by design — always returns a result object, never throws.
 * Callers should check `success` and log/skip accordingly.
 *
 * @param toAddress - Recipient's wallet address
 * @param amount    - Amount in whole PXP units (e.g. 25 = 25 PXP)
 * @param reason    - Human-readable reason for logging
 */
export async function sendPXPReward(
  toAddress: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!PRIVATE_KEY) {
      console.warn(`[sendPXPReward] PRIVATE_KEY not configured, skipping: ${reason}`)
      return { success: false, error: 'Reward distribution not configured' }
    }

    if (!/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
      console.error('[sendPXPReward] PRIVATE_KEY format invalid')
      return { success: false, error: 'Server key configuration error (invalid format)' }
    }

    if (!toAddress || !toAddress.startsWith('0x')) {
      console.warn(`[sendPXPReward] Invalid toAddress "${toAddress}", skipping: ${reason}`)
      return { success: false, error: 'Invalid recipient address' }
    }

    const rpcTransport = http('https://rpc.ankr.com/celo_sepolia', { retryCount: 3 })
    const account = privateKeyToAccount(PRIVATE_KEY)

    const walletClient = createWalletClient({
      account,
      chain: celoSepoliaChain as any,
      transport: rpcTransport,
    })

    const publicClient = createPublicClient({
      chain: celoSepoliaChain as any,
      transport: rpcTransport,
    })

    const txHash = await walletClient.writeContract({
      address: PXP_TOKEN_ADDRESS as `0x${string}`,
      abi: TRANSFER_ABI,
      functionName: 'transfer',
      args: [toAddress as `0x${string}`, parseEther(amount.toString())],
      chain: celoSepoliaChain as any,
      gas: BigInt(100_000),
    })

    await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      timeout: 60_000,
    })

    console.log(
      `[sendPXPReward] ✓ Sent ${amount} PXP to ${toAddress} for: ${reason} (tx: ${txHash})`
    )
    return { success: true, txHash }
  } catch (error: any) {
    console.error(
      `[sendPXPReward] Failed to send ${amount} PXP to ${toAddress} for: ${reason}`,
      error
    )
    return { success: false, error: error.shortMessage || error.message || 'Transfer failed' }
  }
}

// Amount of CELO to airdrop to new users for gas. Covers ~500+ transactions
// on Celo Sepolia at current gas prices. Increase if users run dry.
const GAS_AIRDROP_AMOUNT = parseEther('0.05')
// Only airdrop if the wallet balance is below this threshold (avoids double-funding)
const GAS_AIRDROP_THRESHOLD = parseEther('0.01')

/**
 * Send a small CELO gas airdrop to a new user's wallet so they can pay
 * transaction fees without any manual top-up.
 *
 * Non-fatal by design — login succeeds even if the airdrop fails.
 * Only sends if the wallet balance is below GAS_AIRDROP_THRESHOLD.
 */
export async function sendCeloGasAirdrop(
  toAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string; skipped?: boolean }> {
  try {
    if (!PRIVATE_KEY) {
      console.warn('[sendCeloGasAirdrop] PRIVATE_KEY not configured, skipping')
      return { success: false, error: 'Hot wallet not configured' }
    }

    if (!/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
      console.error('[sendCeloGasAirdrop] PRIVATE_KEY format invalid')
      return { success: false, error: 'Server key configuration error' }
    }

    const rpcTransport = http('https://rpc.ankr.com/celo_sepolia', { retryCount: 3 })
    const account = privateKeyToAccount(PRIVATE_KEY)

    const publicClient = createPublicClient({
      chain: celoSepoliaChain as any,
      transport: rpcTransport,
    })

    // Check current balance — skip if already funded
    const balance = await publicClient.getBalance({ address: toAddress as `0x${string}` })
    if (balance >= GAS_AIRDROP_THRESHOLD) {
      console.log(
        `[sendCeloGasAirdrop] ${toAddress} already has ${formatEther(balance)} CELO, skipping`
      )
      return { success: true, skipped: true }
    }

    const walletClient = createWalletClient({
      account,
      chain: celoSepoliaChain as any,
      transport: rpcTransport,
    })

    const txHash = await walletClient.sendTransaction({
      to: toAddress as `0x${string}`,
      value: GAS_AIRDROP_AMOUNT,
      chain: celoSepoliaChain as any,
    })

    console.log(`[sendCeloGasAirdrop] ✓ Sent 0.05 CELO to ${toAddress} for gas (tx: ${txHash})`)
    return { success: true, txHash }
  } catch (error: any) {
    console.error(`[sendCeloGasAirdrop] Failed to send CELO to ${toAddress}`, error)
    return { success: false, error: error.shortMessage || error.message || 'Airdrop failed' }
  }
}
