'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { CeloPaymentQRCode } from '@/components/qr/QRCodeGenerator'
import { useAuth } from '@/context/AuthContext'

const PXP_TOKEN_ADDRESS = '0x04eAE71832147D75D4B69B3FFB5d9514e8471c75'

// Display metadata keyed by PXPConfig.key — values (PXP amounts) come from the DB
const EARN_WAY_META: Record<string, { icon: string; href: string }> = {
  venue_verified: { icon: '📍', href: '/submit' },
  cav_rewards: { icon: '🎵', href: '/events' },
  wallet_connection: { icon: '👤', href: '/profile' },
  venue_photo: { icon: '📸', href: '/venues' },
  youtube_upload: { icon: '🎬', href: '/profile' },
  youtube_upload_organizer: { icon: '🎬', href: '/profile' },
  curator_verification: { icon: '✅', href: '/curator' },
}

interface EarnWay {
  key: string
  icon: string
  label: string
  href: string
  value: number
  enabled: boolean
}

interface LeaderboardEntry {
  rank: number
  displayName: string | null
  username: string | null
  totalPXPEarned: number
  profileSlug: string | null
}

export default function CommunityDashboard() {
  const { user, isAuthenticated } = useAuth()
  const [pxpBalance, setPxpBalance] = useState<number | null>(null)
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null)
  const [topMembers, setTopMembers] = useState<LeaderboardEntry[]>([])
  const [earnWays, setEarnWays] = useState<EarnWay[]>([])
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const [profileRes, leaderboardRes, pxpRes] = await Promise.all([
          fetch(`/api/profile/${user.walletAddress || user.username}`, { credentials: 'include' }),
          fetch('/api/leaderboard?limit=10'),
          fetch('/api/admin/pxp-config-db', { credentials: 'include' }),
        ])

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setPxpBalance(profileData.profile?.totalPXPEarned ?? 0)
        }

        if (leaderboardRes.ok) {
          const lbData = await leaderboardRes.json()
          setTopMembers(lbData.entries || [])
          const myEntry = lbData.entries?.find(
            (e: any) =>
              e.username === user.username ||
              e.walletAddress?.toLowerCase() === user.walletAddress?.toLowerCase()
          )
          if (myEntry) setLeaderboardRank(myEntry.rank)
          else if (lbData.currentUser) setLeaderboardRank(lbData.currentUser.rank)
        }

        if (pxpRes.ok) {
          const pxpData = await pxpRes.json()
          const ways: EarnWay[] = (pxpData.configs as any[])
            .filter((c) => c.enabled && EARN_WAY_META[c.key])
            .map((c) => ({
              key: c.key,
              icon: EARN_WAY_META[c.key].icon,
              label: c.label,
              href: EARN_WAY_META[c.key].href,
              value: c.value,
              enabled: c.enabled,
            }))
            .sort((a, b) => b.value - a.value)
          setEarnWays(ways)
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, user])

  const displayName = user?.displayName || user?.username || 'Community Member'
  const walletAddress = user?.walletAddress || ''

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-gray-600">Please sign in to view your dashboard.</p>
          <Link
            href="/auth/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Your Global Piano Network dashboard
          </p>
        </div>

        {/* PXP Balance Hero */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-indigo-200">Your PXP Balance</p>
              <p className="text-5xl font-bold">{loading ? '—' : (pxpBalance ?? 0).toFixed(0)}</p>
              <p className="mt-1 text-indigo-200">Piano Experience Points</p>
            </div>
            <div className="text-5xl opacity-80">🎹</div>
          </div>

          {leaderboardRank && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
              🏆 Ranked #{leaderboardRank} on the community leaderboard
            </div>
          )}

          <div className="mt-4 text-sm text-indigo-200">
            PXP reflects your contributions to the Global Piano Network — venues discovered, events
            attended, musicians connected.
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Ways to Earn */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
              Ways to Earn PXP
            </h2>
            <div className="space-y-3">
              {earnWays.length === 0 ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : (
                earnWays.map((way) => (
                  <Link
                    key={way.key}
                    href={way.href}
                    className="flex items-center justify-between rounded-lg p-3 transition hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{way.icon}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {way.label}
                      </span>
                    </div>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      +{way.value} PXP
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Top Community Members */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Community Leaderboard
              </h2>
              <Link
                href="/leaderboard"
                className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Full list →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                ))}
              </div>
            ) : topMembers.length === 0 ? (
              <p className="text-sm text-gray-500">No leaderboard data yet.</p>
            ) : (
              <div className="space-y-2">
                {topMembers.slice(0, 5).map((member, i) => {
                  const isMe =
                    member.username === user?.username ||
                    (member as any).walletAddress?.toLowerCase() ===
                      user?.walletAddress?.toLowerCase()
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        isMe ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-sm font-bold text-gray-400">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                        </span>
                        <span
                          className={`text-sm font-medium ${isMe ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}
                        >
                          {member.displayName || member.username || 'Anonymous'}
                          {isMe && ' (you)'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {member.totalPXPEarned.toFixed(0)} PXP
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: '📍', label: 'Venues', href: '/venues' },
            { icon: '🎵', label: 'Events', href: '/events' },
            { icon: '👥', label: 'Musicians', href: '/musicians' },
            {
              icon: '👤',
              label: 'My Profile',
              href: user?.walletAddress ? `/profile/${user.walletAddress}` : '/profile',
            },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <span className="mb-2 text-2xl">{link.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Receive PXP — collapsible */}
        {walletAddress && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex w-full items-center justify-between px-6 py-4 text-left"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                📲 Receive PXP from another member
              </span>
              <span className="text-gray-400">{showQR ? '▲' : '▼'}</span>
            </button>
            {showQR && (
              <div className="border-t border-gray-100 px-6 py-6 dark:border-gray-700">
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Another community member can scan this to send you PXP directly.
                </p>
                <div className="flex justify-center">
                  <CeloPaymentQRCode
                    address={walletAddress}
                    tokenAddress={PXP_TOKEN_ADDRESS}
                    memo="PXP transfer"
                    size={220}
                    showCopyButton={true}
                    allowDownload={true}
                    downloadFilename="my-gpn-address"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
