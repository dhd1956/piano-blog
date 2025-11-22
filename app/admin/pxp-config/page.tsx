'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useBlockNumber } from 'wagmi'
import { PXP_REWARDS_ABI, PXP_REWARDS_ADDRESS } from '@/utils/rewards-contract'

interface PXPConfig {
  rewards: {
    newUser: number
    scout: number
    verifier: number
  }
  limits: {
    min: number
    max: number
  }
  contractBalance: string
  contractAddress: string
  timestamp: string
}

export default function PXPConfigPage() {
  const { address, isConnected } = useAccount()
  const { writeContract, isPending: isWritePending } = useWriteContract()
  const { data: blockNumber } = useBlockNumber({ watch: true })

  // Read contract data directly from blockchain via browser
  const {
    data: rewardsData,
    refetch: refetchRewards,
    isLoading: rewardsLoading,
    error: rewardsError,
  } = useReadContract({
    address: PXP_REWARDS_ADDRESS as `0x${string}`,
    abi: PXP_REWARDS_ABI,
    functionName: 'getAllRewards',
    chainId: 44787, // Celo Alfajores testnet
  })

  const {
    data: limitsData,
    isLoading: limitsLoading,
    error: limitsError,
  } = useReadContract({
    address: PXP_REWARDS_ADDRESS as `0x${string}`,
    abi: PXP_REWARDS_ABI,
    functionName: 'getRewardLimits',
    chainId: 44787, // Celo Alfajores testnet
  })

  const {
    data: contractBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useReadContract({
    address: PXP_REWARDS_ADDRESS as `0x${string}`,
    abi: PXP_REWARDS_ABI,
    functionName: 'getContractBalance',
    chainId: 44787, // Celo Alfajores testnet
  })

  const [config, setConfig] = useState<PXPConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [authStatus, setAuthStatus] = useState<string>('Checking authentication...')

  // Form state
  const [newUserReward, setNewUserReward] = useState<number>(25)
  const [scoutReward, setScoutReward] = useState<number>(50)
  const [verifierReward, setVerifierReward] = useState<number>(25)

  // Process contract data when loaded
  useEffect(() => {
    // Check for errors first
    if (rewardsError || limitsError || balanceError) {
      const errorMsg =
        rewardsError?.message || limitsError?.message || balanceError?.message || 'Unknown error'
      setError(`Failed to load from blockchain: ${errorMsg}`)
      setLoading(false)
      return
    }

    // Check if still loading
    if (rewardsLoading || limitsLoading || balanceLoading) {
      setLoading(true)
      return
    }

    // Process data if all loaded successfully
    if (rewardsData && limitsData && contractBalance) {
      const [newUser, scout, verifier] = rewardsData as [bigint, bigint, bigint]
      const [min, max] = limitsData as [bigint, bigint]

      setConfig({
        rewards: {
          newUser: Number(newUser),
          scout: Number(scout),
          verifier: Number(verifier),
        },
        limits: {
          min: Number(min),
          max: Number(max),
        },
        contractBalance: (Number(contractBalance) / 1e18).toString(),
        contractAddress: PXP_REWARDS_ADDRESS,
        timestamp: new Date().toISOString(),
      })

      setNewUserReward(Number(newUser))
      setScoutReward(Number(scout))
      setVerifierReward(Number(verifier))
      setLoading(false)
      setError(null)
    }
  }, [
    rewardsData,
    limitsData,
    contractBalance,
    rewardsLoading,
    limitsLoading,
    balanceLoading,
    rewardsError,
    limitsError,
    balanceError,
  ])

  // Auto-authenticate with wallet when connected
  useEffect(() => {
    if (isConnected && address) {
      authenticateWithWallet()
    } else {
      setAuthStatus('Wallet not connected')
      setLoading(false)
    }
  }, [isConnected, address])

  const authenticateWithWallet = async () => {
    if (!address) return

    try {
      setAuthStatus('Authenticating with wallet...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ walletAddress: address }),
      })

      const data = await response.json()

      if (response.ok) {
        setAuthStatus(`Authenticated as ${data.user.role}`)
      } else {
        setAuthStatus(`Auth failed: ${data.message}`)
        setError(`Authentication failed: ${data.message}`)
        setLoading(false)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown'
      setAuthStatus(`Auth error: ${errorMsg}`)
      setError(`Failed to authenticate: ${errorMsg}`)
      setLoading(false)
    }
  }

  // Removed fetchConfig - now reading directly from blockchain via wagmi hooks

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      setError('Please connect your wallet to update rewards')
      return
    }

    // Validate reward amounts
    if (config) {
      if (
        newUserReward < config.limits.min ||
        newUserReward > config.limits.max ||
        scoutReward < config.limits.min ||
        scoutReward > config.limits.max ||
        verifierReward < config.limits.min ||
        verifierReward > config.limits.max
      ) {
        setError(`Reward amounts must be between ${config.limits.min} and ${config.limits.max} PXP`)
        return
      }
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Call smart contract directly via MetaMask
      writeContract(
        {
          address: PXP_REWARDS_ADDRESS as `0x${string}`,
          abi: PXP_REWARDS_ABI,
          functionName: 'setAllRewards',
          args: [BigInt(newUserReward), BigInt(scoutReward), BigInt(verifierReward)],
          chainId: 44787, // Celo Alfajores
        },
        {
          onSuccess: () => {
            setSuccess(true)
            setSaving(false)
            // Refresh config after successful update
            setTimeout(() => {
              refetchRewards()
              setSuccess(false)
            }, 3000)
          },
          onError: (err) => {
            setError(err.message || 'Failed to update rewards')
            setSaving(false)
          },
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rewards')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">PXP Reward Configuration</h1>
        <div className="rounded-lg border border-gray-300 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">Loading configuration...</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">Status: {authStatus}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">PXP Reward Configuration</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        Configure Piano Experience Points rewards for community actions
      </p>

      {/* Auth Status */}
      <div className="mb-6 rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
        <p className="text-sm text-blue-800 dark:text-blue-400">
          <span className="font-semibold">Auth Status:</span> {authStatus}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 rounded-lg border border-green-300 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400">
          <p className="font-semibold">✓ Success!</p>
          <p>Reward amounts updated successfully</p>
        </div>
      )}

      {/* Current Configuration */}
      {config && (
        <div className="mb-8 rounded-lg border border-gray-300 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
          <h2 className="mb-4 text-xl font-semibold">Current Configuration</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contract Address</p>
              <p className="font-mono text-sm">{config.contractAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contract Balance</p>
              <p className="font-semibold">{config.contractBalance} PXP</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reward Limits</p>
              <p className="font-semibold">
                {config.limits.min} - {config.limits.max} PXP
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
              <p className="text-sm">{new Date(config.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-gray-300 bg-white p-8 dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 className="mb-6 text-xl font-semibold">Update Reward Amounts</h2>

        <div className="space-y-6">
          {/* New User Reward */}
          <div>
            <label htmlFor="newUser" className="mb-2 block font-medium">
              New User Reward
              <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                (Earned when user signs up)
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="newUser"
                value={newUserReward}
                onChange={(e) => setNewUserReward(Number(e.target.value))}
                min={config?.limits.min || 1}
                max={config?.limits.max || 1000}
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                required
              />
              <span className="font-semibold text-gray-700 dark:text-gray-300">PXP</span>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Current: {config?.rewards.newUser} PXP
            </p>
          </div>

          {/* Scout Reward */}
          <div>
            <label htmlFor="scout" className="mb-2 block font-medium">
              Scout Reward
              <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                (Earned when discovered venue is verified)
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="scout"
                value={scoutReward}
                onChange={(e) => setScoutReward(Number(e.target.value))}
                min={config?.limits.min || 1}
                max={config?.limits.max || 1000}
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                required
              />
              <span className="font-semibold text-gray-700 dark:text-gray-300">PXP</span>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Current: {config?.rewards.scout} PXP
            </p>
          </div>

          {/* Verifier Reward */}
          <div>
            <label htmlFor="verifier" className="mb-2 block font-medium">
              Verifier Reward
              <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                (Earned when verifying a venue)
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="verifier"
                value={verifierReward}
                onChange={(e) => setVerifierReward(Number(e.target.value))}
                min={config?.limits.min || 1}
                max={config?.limits.max || 1000}
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                required
              />
              <span className="font-semibold text-gray-700 dark:text-gray-300">PXP</span>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Current: {config?.rewards.verifier} PXP
            </p>
          </div>
        </div>

        {/* Wallet Connection Warning */}
        {!isConnected && (
          <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            <p className="font-semibold">⚠ Wallet Not Connected</p>
            <p>Please connect your wallet to update reward amounts</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              refetchRewards()
            }}
            className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Refresh
          </button>
          <button
            type="submit"
            disabled={!isConnected || saving}
            className="bg-primary-600 hover:bg-primary-700 rounded-lg px-6 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Update Rewards'}
          </button>
        </div>
      </form>

      {/* Info Section */}
      <div className="mt-8 rounded-lg border border-blue-300 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-900/20">
        <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">ℹ️ Important Notes</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-400">
          <li>Only the contract owner (blog owner) can update reward amounts</li>
          <li>Changes require a blockchain transaction with gas fees</li>
          <li>
            Reward amounts must be between {config?.limits.min} and {config?.limits.max} PXP
          </li>
          <li>Updates take effect immediately after transaction confirmation</li>
          <li>Ensure contract has sufficient PXP balance to fund rewards</li>
        </ul>
      </div>
    </div>
  )
}
