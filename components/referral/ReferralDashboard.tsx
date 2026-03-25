'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

interface ReferralStats {
  referralCode: string | null
  totalReferrals: number
  totalPXPEarned: number
  shareUrl: string | null
}

interface ReferredUser {
  id: number
  displayName: string | null
  username: string | null
  avatar: string | null
  createdAt: string
  profileCompleted: boolean
  totalPXPEarned: number
}

interface ReferralConfig {
  profileCreated: number
  firstEvent: number
  maxPerUser: number
}

export default function ReferralDashboard() {
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = useState<ReferredUser[]>([])
  const [config, setConfig] = useState<ReferralConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchReferralData()
    }
  }, [isAuthenticated])

  const fetchReferralData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/referral/stats', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch referral stats')
      }

      const data = await response.json()
      setStats(data.stats)
      setReferrals(data.referrals || [])
      setConfig(data.config)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referral data')
    } finally {
      setLoading(false)
    }
  }

  const generateReferralCode = async () => {
    try {
      setGenerating(true)
      setError(null)

      const response = await fetch('/api/user/referral/generate', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to generate referral code')
      }

      const data = await response.json()
      await fetchReferralData() // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate referral code')
    } finally {
      setGenerating(false)
    }
  }

  const copyShareUrl = () => {
    if (stats?.shareUrl) {
      navigator.clipboard.writeText(stats.shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          Please sign in to view your referral dashboard
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">Loading referral data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Referral Code Card */}
      <div className="rounded-lg border border-gray-300 bg-gradient-to-br from-blue-50 to-purple-50 p-6 dark:border-gray-700 dark:from-blue-900/20 dark:to-purple-900/20">
        <h2 className="mb-4 text-2xl font-bold">Your Referral Code</h2>

        {!stats?.referralCode ? (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Generate your unique referral code to invite other musicians and earn PXP rewards!
            </p>
            <button
              onClick={generateReferralCode}
              disabled={generating}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Referral Code'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                Your Referral Code
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.referralCode}
              </p>
            </div>

            <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                Share Link
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={stats.shareUrl || ''}
                  readOnly
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                />
                <button
                  onClick={copyShareUrl}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats?.referralCode && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Referrals
            </p>
            <p className="text-3xl font-bold">{stats.totalReferrals}</p>
          </div>

          <div className="rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              PXP Earned from Referrals
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.totalPXPEarned}
            </p>
          </div>

          <div className="rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              Remaining to Cap
            </p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {config ? Math.max(0, config.maxPerUser - stats.totalPXPEarned) : 0}
            </p>
          </div>
        </div>
      )}

      {/* Reward Info */}
      {config && (
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-900/20">
          <h3 className="mb-3 font-semibold text-blue-900 dark:text-blue-300">
            💰 How to Earn Referral PXP
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
            <li>
              <strong>{config.profileCreated} PXP</strong> when referred user completes their
              profile
            </li>
            <li>
              <strong>{config.firstEvent} PXP</strong> when referred user attends their first event
            </li>
            <li>
              <strong>Maximum {config.maxPerUser} PXP</strong> total from all referrals
            </li>
          </ul>
        </div>
      )}

      {/* Referred Users List */}
      {stats?.referralCode && referrals.length > 0 && (
        <div className="rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-xl font-semibold">Your Referrals ({referrals.length})</h3>
          <div className="space-y-3">
            {referrals.map((referred) => (
              <div
                key={referred.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {referred.avatar && (
                    <img
                      src={referred.avatar}
                      alt={referred.displayName || referred.username || 'User'}
                      className="h-10 w-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold">
                      {referred.displayName || referred.username || `User ${referred.id}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Joined {new Date(referred.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {referred.totalPXPEarned} PXP
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {referred.profileCompleted ? '✓ Profile Complete' : 'Profile Incomplete'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats?.referralCode && referrals.length === 0 && (
        <div className="rounded-lg border border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="mb-4 text-xl font-semibold text-gray-600 dark:text-gray-400">
            No referrals yet
          </p>
          <p className="text-gray-500 dark:text-gray-500">
            Share your referral link to invite musicians and start earning PXP!
          </p>
        </div>
      )}
    </div>
  )
}
