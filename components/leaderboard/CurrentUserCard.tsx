'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { CurrentUserRank } from '@/types/leaderboard'

interface CurrentUserCardProps {
  currentUser: CurrentUserRank
}

export default function CurrentUserCard({ currentUser }: CurrentUserCardProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const { rank, entry } = currentUser

  const getRankColor = () => {
    if (rank === 1) return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    if (rank === 2) return 'border-gray-400 bg-gray-50 dark:bg-gray-900/20'
    if (rank === 3) return 'border-amber-600 bg-amber-50 dark:bg-amber-900/20'
    if (rank <= 10) return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
    return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
  }

  const getRankEmoji = () => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    if (rank <= 10) return '⭐'
    return '🎯'
  }

  return (
    <div
      className={`sticky top-4 z-20 mb-6 overflow-hidden rounded-xl border-2 shadow-lg ${getRankColor()}`}
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Ranking</h3>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>

        {/* Row 1: rank + avatar + name/stats */}
        <div className="flex items-center gap-3">
          {/* Rank Badge */}
          <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-full bg-white shadow-md dark:bg-gray-800">
            <div className="text-2xl">{getRankEmoji()}</div>
            <div className="text-xs font-bold text-gray-700 dark:text-gray-300">#{rank}</div>
          </div>

          {/* Avatar */}
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            {entry.avatar ? (
              <Image src={entry.avatar} alt={entry.displayName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-500">
                {entry.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-bold text-gray-900 dark:text-white">
              {entry.displayName}
            </h4>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600 dark:text-gray-400">
              <span>🗺️ {entry.venuesDiscovered} venues</span>
              <span>✍️ {entry.reviewCount} reviews</span>
            </div>
          </div>
        </div>

        {/* Row 2: PXP + View Profile */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {entry.totalPXPEarned.toLocaleString()}
            </span>
            <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">PXP Earned</span>
          </div>
          <Link
            href={`/profile/${entry.profileIdentifier}`}
            className="flex-shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            View Profile
          </Link>
        </div>

        {/* Encouragement Message */}
        <div className="mt-4 rounded-lg bg-white/50 p-3 text-center text-sm text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
          {rank <= 3 && (
            <span className="font-semibold">
              🎉 Amazing! You're in the top 3! Keep up the great work!
            </span>
          )}
          {rank > 3 && rank <= 10 && (
            <span className="font-semibold">
              🌟 Great job! You're in the top 10! So close to the podium!
            </span>
          )}
          {rank > 10 && rank <= 50 && (
            <span>Keep contributing to climb higher on the leaderboard!</span>
          )}
          {rank > 50 && <span>Every contribution counts! Earn more PXP to climb the ranks.</span>}
        </div>
      </div>
    </div>
  )
}
