'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

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
  const { user, isAuthenticated, hasWallet } = useAuth()
  const isBlogOwner = user?.role === 'BLOG_OWNER'

  // Database state
  const [databaseRewards, setDatabaseRewards] = useState<DatabaseReward[]>([])
  const [editedRewards, setEditedRewards] = useState<Record<string, number>>({})

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [authStatus, setAuthStatus] = useState<string>('Checking authentication...')

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
    } else {
      setAuthStatus('Not authenticated - Please sign in')
    }
  }, [isAuthenticated, user, hasWallet])

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

      {!isBlogOwner && (
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <span className="font-semibold">Read-only view.</span> Only the blog owner can modify
            these values.
          </p>
        </div>
      )}

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
                    <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                      {reward.label}
                    </p>
                    {reward.description && (
                      <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                        {reward.description}
                      </p>
                    )}
                    {isBlogOwner ? (
                      <>
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
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            PXP
                          </span>
                        </div>
                        {editedRewards[reward.key] !== undefined &&
                          editedRewards[reward.key] !== reward.value && (
                            <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">
                              Modified (was {reward.value})
                            </p>
                          )}
                      </>
                    ) : (
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {reward.value}{' '}
                        <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                          PXP
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {isBlogOwner && (
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
        )}
      </form>
    </div>
  )
}

export default dynamic(() => Promise.resolve(PXPConfigPage), { ssr: false })
