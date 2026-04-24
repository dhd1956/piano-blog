'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { LeaderboardEntry as LeaderboardEntryType } from '@/types/leaderboard'

interface LeaderboardEntryProps {
  user: LeaderboardEntryType
  isCurrentUser?: boolean
}

const RankBadge = ({ rank }: { rank: number }) => {
  const getBadgeStyle = () => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg'
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg'
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg'
    if (rank <= 10) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }

  const getBadgeIcon = () => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    if (rank <= 10) return '⭐'
    return '#'
  }

  return (
    <div
      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-bold ${getBadgeStyle()}`}
    >
      <span className="text-sm">{rank <= 10 ? getBadgeIcon() : rank}</span>
    </div>
  )
}

export default function LeaderboardEntry({ user, isCurrentUser = false }: LeaderboardEntryProps) {
  return (
    <Link href={`/profile/${user.profileIdentifier}`}>
      <div
        className={`flex items-center gap-4 rounded-lg border p-4 transition-all hover:shadow-lg ${
          isCurrentUser
            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
        }`}
      >
        {/* Rank Badge */}
        <RankBadge rank={user.rank} />

        {/* Avatar */}
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          {user.avatar ? (
            <Image src={user.avatar} alt={user.displayName} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-500">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900 dark:text-white">
              {user.displayName}
            </h3>
            {isCurrentUser && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                You
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            {user.location && (
              <span className="flex items-center gap-1">
                <span>📍</span>
                <span className="hidden sm:inline">{user.location}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <span>🗺️</span>
              <span>{user.venuesDiscovered} venues</span>
            </span>
          </div>
        </div>

        {/* PXP Badge */}
        <div className="flex-shrink-0 text-right">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {user.totalPXPEarned.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">PXP</div>
        </div>

        {/* Badges */}
        {user.badges.length > 0 && (
          <div className="hidden items-center gap-1 lg:flex">
            {user.badges.slice(0, 3).map((badge, index) => (
              <span
                key={index}
                className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                title={badge}
              >
                {badge.split('_')[0]}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
