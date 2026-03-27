'use client'

import { useEffect, useState } from 'react'
import { PXP_REWARDS_ADDRESS } from '@/utils/rewards-contract'
import { useAuth } from '@/context/AuthContext'

interface WelcomeRewardBannerProps {
  userAddress?: string
}

export default function WelcomeRewardBanner({ userAddress }: WelcomeRewardBannerProps) {
  const { user, refreshUser } = useAuth()
  const walletAddress = userAddress || user?.walletAddress || undefined

  const [eligible, setEligible] = useState(false)
  const [rewardAmount, setRewardAmount] = useState(0)
  const [claiming, setClaiming] = useState(false)
  const [message, setMessage] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!walletAddress) return

    fetch(`/api/rewards/check-welcome?address=${walletAddress}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.eligible) {
          setEligible(true)
          setRewardAmount(data.amount ?? 0)
        }
      })
      .catch((err) => console.error('Error checking reward eligibility:', err))
  }, [walletAddress])

  const handleClaim = async () => {
    if (!walletAddress) return

    setClaiming(true)
    setMessage('')

    try {
      const res = await fetch('/api/rewards/claim-welcome', {
        method: 'POST',
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim reward')
      }

      const txSuffix = data.hash
        ? ` Tx: ${(data.hash as string).slice(0, 10)}…`
        : PXP_REWARDS_ADDRESS === '0x0000000000000000000000000000000000000000'
          ? ' (dev mode)'
          : ''

      setMessage(`🎉 You earned ${rewardAmount} PXP!${txSuffix}`)
      setEligible(false)
      await refreshUser()
    } catch (error: any) {
      console.error('[WelcomeRewardBanner] Error claiming reward:', error)
      setMessage(`❌ ${error.message || 'Failed to claim reward. Please try again.'}`)
    } finally {
      setClaiming(false)
    }
  }

  if (!eligible || dismissed) return null

  return (
    <div className="mb-6 rounded-lg border-2 border-blue-500 bg-blue-50 p-6 dark:bg-blue-900/20">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
            🎁 Welcome Reward Available!
          </h3>
          <p className="mt-2 text-blue-800 dark:text-blue-200">
            Claim your welcome reward of <strong>{rewardAmount} PXP tokens</strong> for joining the
            Piano Blog community!
          </p>

          {message && (
            <div
              className={`mt-3 rounded p-3 ${
                message.startsWith('🎉')
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {claiming ? 'Claiming...' : 'Claim Reward'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
