'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { useAuth } from '@/context/AuthContext'
import { PXP_REWARDS_ABI, PXP_REWARDS_ADDRESS } from '@/utils/rewards-contract'

interface BlockchainConfig {
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
}

interface DatabaseReward {
  id: number
  key: string
  value: number
  label: string
  description: string | null
  category: string
  enabled: boolean
}

function PXPConfigPage() {
  const { address, isConnected } = useAccount()
  const { user, isAuthenticated, hasWallet } = useAuth()
  const { writeContract, isPending: isWritePending } = useWriteContract()

  // Blockchain state
  const [blockchainConfig, setBlockchainConfig] = useState<BlockchainConfig | null>(null)
  const [newUserReward, setNewUserReward] = useState<number>(25)
  const [scoutReward, setScoutReward] = useState<number>(50)
  const [verifierReward, setVerifierReward] = useState<number>(25)

  // Database state
  const [databaseRewards, setDatabaseRewards] = useState<DatabaseReward[]>([])
  const [editedRewards, setEditedRewards] = useState<Record<string, number>>({})

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [authStatus, setAuthStatus] = useState<string>('Checking authentication...')
  const [activeTab, setActiveTab] = useState<'blockchain' | 'database'>('database')

  // Read contract data
  const {
    data: rewardsData,
    refetch: refetchRewards,
    isLoading: rewardsLoading,
    error: rewardsError,
  } = useReadContract({
    address: PXP_REWARDS_ADDRESS as `0x${string}`,
    abi: PXP_REWARDS_ABI,
    functionName: 'getAllRewards',
    chainId: 11142220,
  })

  const {
    data: limitsData,
    isLoading: limitsLoading,
    error: limitsError,
  } = useReadContract({
    address: PXP_REWARDS_ADDRESS as `0x${string}`,
    abi: PXP_REWARDS_ABI,
    functionName: 'getRewardLimits',
    chainId: 11142220,
  })

  const {
    data: contractBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useReadContract({
    address: PXP_REWARDS_ADDRESS as `0x${string}`,
    abi: PXP_REWARDS_ABI,
    functionName: 'getContractBalance',
    chainId: 11142220,
  })

  // Process blockchain contract data
  useEffect(() => {
    if (rewardsError || limitsError || balanceError) {
      const errorMsg =
        rewardsError?.message || limitsError?.message || balanceError?.message || 'Unknown error'
      setError(`Failed to load blockchain data: ${errorMsg}`)
      return
    }

    if (rewardsData && limitsData && contractBalance) {
      const [newUser, scout, verifier] = rewardsData as [bigint, bigint, bigint]
      const [min, max] = limitsData as [bigint, bigint]

      const newUserPXP = Number(newUser) / 1e18
      const scoutPXP = Number(scout) / 1e18
      const verifierPXP = Number(verifier) / 1e18
      const minPXP = Number(min) / 1e18
      const maxPXP = Number(max) / 1e18

      setBlockchainConfig({
        rewards: {
          newUser: newUserPXP,
          scout: scoutPXP,
          verifier: verifierPXP,
        },
        limits: {
          min: minPXP,
          max: maxPXP,
        },
        contractBalance: Math.floor(Number(contractBalance) / 1e18).toLocaleString(),
        contractAddress: PXP_REWARDS_ADDRESS,
      })

      setNewUserReward(newUserPXP)
      setScoutReward(scoutPXP)
      setVerifierReward(verifierPXP)
    }
  }, [rewardsData, limitsData, contractBalance, rewardsError, limitsError, balanceError])

  // Fetch database rewards
  useEffect(() => {
    const fetchDatabaseRewards = async () => {
      try {
        const response = await fetch('/api/admin/pxp-config-db', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setDatabaseRewards(data.configs)
          }
        }
      } catch (err) {
        console.error('Error fetching database rewards:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDatabaseRewards()
  }, [])

  // Check authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      if (hasWallet || user.walletAddress) {
        setAuthStatus(
          `Authenticated as ${user.role} (Wallet: ${user.walletAddress?.slice(0, 6)}...${user.walletAddress?.slice(-4)})`
        )
      } else {
        setAuthStatus(`Authenticated as ${user.role} (No wallet linked)`)
      }
    } else if (isConnected && address) {
      setAuthStatus(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`)
    } else {
      setAuthStatus('Not authenticated - Please sign in')
    }
  }, [isAuthenticated, user, hasWallet, isConnected, address])

  // Save blockchain rewards
  const handleBlockchainSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      setError('Please connect your wallet to sign the blockchain transaction')
      return
    }

    if (blockchainConfig) {
      if (
        newUserReward < blockchainConfig.limits.min ||
        newUserReward > blockchainConfig.limits.max ||
        scoutReward < blockchainConfig.limits.min ||
        scoutReward > blockchainConfig.limits.max ||
        verifierReward < blockchainConfig.limits.min ||
        verifierReward > blockchainConfig.limits.max
      ) {
        setError(
          `Reward amounts must be between ${blockchainConfig.limits.min} and ${blockchainConfig.limits.max} PXP`
        )
        return
      }
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const newUserWei = BigInt(Math.round(newUserReward * 1e18))
      const scoutWei = BigInt(Math.round(scoutReward * 1e18))
      const verifierWei = BigInt(Math.round(verifierReward * 1e18))

      writeContract(
        {
          address: PXP_REWARDS_ADDRESS as `0x${string}`,
          abi: PXP_REWARDS_ABI,
          functionName: 'setAllRewards',
          args: [newUserWei, scoutWei, verifierWei],
          chainId: 11142220,
        },
        {
          onSuccess: () => {
            setSuccess(true)
            setSaving(false)
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

  // Save database rewards
  const handleDatabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const updates = Object.entries(editedRewards).map(([key, value]) => ({
        key,
        value,
      }))

      const response = await fetch('/api/admin/pxp-config-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setEditedRewards({})
        // Refetch to get updated values
        const refetchResponse = await fetch('/api/admin/pxp-config-db', {
          credentials: 'include',
        })
        if (refetchResponse.ok) {
          const refetchData = await refetchResponse.json()
          setDatabaseRewards(refetchData.configs)
        }
      } else {
        setError(data.error || 'Failed to update rewards')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rewards')
    } finally {
      setSaving(false)
    }
  }

  const handleRewardChange = (key: string, value: number) => {
    setEditedRewards((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const getCurrentValue = (reward: DatabaseReward) => {
    return editedRewards[reward.key] ?? reward.value
  }

  const groupedRewards = databaseRewards.reduce(
    (acc, reward) => {
      if (!acc[reward.category]) {
        acc[reward.category] = []
      }
      acc[reward.category].push(reward)
      return acc
    },
    {} as Record<string, DatabaseReward[]>
  )

  const categoryLabels: Record<string, string> = {
    onboarding: 'Onboarding Rewards',
    referral: 'Referral Rewards',
    youtube: 'YouTube Rewards',
    event: 'Event Participation',
    community: 'Community Contributions',
  }

  if (loading && databaseRewards.length === 0) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">PXP Reward Configuration</h1>
        <div className="rounded-lg border border-gray-300 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">Loading configuration...</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">Status: {authStatus}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">PXP Reward Configuration</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        Configure Piano Experience Points rewards for all community actions
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

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'database'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Database Rewards (All Actions)
        </button>
        <button
          onClick={() => setActiveTab('blockchain')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'blockchain'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Blockchain Rewards (Legacy)
        </button>
      </div>

      {/* Database Rewards Tab */}
      {activeTab === 'database' && (
        <form
          onSubmit={handleDatabaseSubmit}
          className="rounded-lg border border-gray-300 bg-white p-8 dark:border-gray-700 dark:bg-gray-800"
        >
          <h2 className="mb-6 text-xl font-semibold">All PXP Earning Actions</h2>

          <div className="space-y-8">
            {Object.entries(groupedRewards).map(([category, rewards]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {categoryLabels[category] || category}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {rewards.map((reward) => (
                    <div
                      key={reward.key}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50"
                    >
                      <label htmlFor={reward.key} className="mb-2 block font-medium">
                        {reward.label}
                        {reward.description && (
                          <span className="ml-2 block text-sm font-normal text-gray-600 dark:text-gray-400">
                            {reward.description}
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          id={reward.key}
                          value={getCurrentValue(reward)}
                          onChange={(e) => handleRewardChange(reward.key, Number(e.target.value))}
                          min={0}
                          max={10000}
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">PXP</span>
                      </div>
                      {editedRewards[reward.key] !== undefined &&
                        editedRewards[reward.key] !== reward.value && (
                          <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">
                            Modified (was {reward.value})
                          </p>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setEditedRewards({})}
              className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              disabled={Object.keys(editedRewards).length === 0}
            >
              Reset Changes
            </button>
            <button
              type="submit"
              disabled={saving || Object.keys(editedRewards).length === 0}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : `Save Changes (${Object.keys(editedRewards).length})`}
            </button>
          </div>
        </form>
      )}

      {/* Blockchain Rewards Tab */}
      {activeTab === 'blockchain' && (
        <>
          {/* Current Configuration */}
          {blockchainConfig && (
            <div className="mb-8 rounded-lg border border-gray-300 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
              <h2 className="mb-4 text-xl font-semibold">Current Blockchain Configuration</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Contract Address</p>
                  <p className="font-mono text-sm">{blockchainConfig.contractAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Contract Balance</p>
                  <p className="font-semibold">{blockchainConfig.contractBalance} PXP</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reward Limits</p>
                  <p className="font-semibold">
                    {blockchainConfig.limits.min} - {blockchainConfig.limits.max} PXP
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <form
            onSubmit={handleBlockchainSubmit}
            className="rounded-lg border border-gray-300 bg-white p-8 dark:border-gray-700 dark:bg-gray-800"
          >
            <h2 className="mb-6 text-xl font-semibold">Update Blockchain Reward Amounts</h2>

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
                    min={blockchainConfig?.limits.min || 1}
                    max={blockchainConfig?.limits.max || 1000}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    required
                  />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">PXP</span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Current: {blockchainConfig?.rewards.newUser} PXP
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
                    min={blockchainConfig?.limits.min || 1}
                    max={blockchainConfig?.limits.max || 1000}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    required
                  />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">PXP</span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Current: {blockchainConfig?.rewards.scout} PXP
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
                    min={blockchainConfig?.limits.min || 1}
                    max={blockchainConfig?.limits.max || 1000}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    required
                  />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">PXP</span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Current: {blockchainConfig?.rewards.verifier} PXP
                </p>
              </div>
            </div>

            {/* Wallet Connection Warning */}
            {!isConnected && (
              <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                <p className="font-semibold">⚠ Wallet Not Connected</p>
                <p>You need to connect your wallet to update blockchain reward amounts.</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => refetchRewards()}
                className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Refresh
              </button>
              <button
                type="submit"
                disabled={!isConnected || saving}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Blockchain Rewards'}
              </button>
            </div>
          </form>

          {/* Info Section */}
          <div className="mt-8 rounded-lg border border-blue-300 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-900/20">
            <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">
              ℹ️ Blockchain Rewards (Legacy)
            </h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-400">
              <li>These rewards are stored on the Celo Sepolia blockchain</li>
              <li>Only the contract owner can update these amounts</li>
              <li>Changes require a blockchain transaction with gas fees</li>
              <li>Updates take effect immediately after transaction confirmation</li>
              <li>
                Most rewards are now managed via the Database Rewards tab (no gas fees required)
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

export default dynamic(() => Promise.resolve(PXPConfigPage), { ssr: false })
