'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { LeaderboardEntry } from '@/types/leaderboard'

interface TopThreeSpotlightProps {
  users: LeaderboardEntry[]
}

export default function TopThreeSpotlight({ users }: TopThreeSpotlightProps) {
  if (!users || users.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          No leaderboard entries yet. Be the first to earn PXP!
        </p>
      </div>
    )
  }

  const medals = ['🥇', '🥈', '🥉']
  const gradients = [
    'from-yellow-400 via-yellow-500 to-yellow-600',
    'from-gray-300 via-gray-400 to-gray-500',
    'from-amber-600 via-amber-700 to-amber-800',
  ]
  const rings = [
    'ring-yellow-400 ring-offset-yellow-100',
    'ring-gray-400 ring-offset-gray-100',
    'ring-amber-600 ring-offset-amber-100',
  ]

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
        🏆 Top Contributors
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {users.map((user, index) => {
          const rank = index + 1
          if (rank > 3) return null

          return (
            <Link key={user.userId} href={`/profile/${user.profileIdentifier}`} className="group">
              <div
                className={`relative overflow-hidden rounded-2xl border-4 bg-gradient-to-br p-8 text-center shadow-xl transition-all hover:scale-105 hover:shadow-2xl ${gradients[index]} border-white dark:border-gray-800`}
              >
                {/* Medal */}
                <div className="mb-4 text-7xl drop-shadow-lg">{medals[index]}</div>

                {/* Avatar */}
                <div className="mx-auto mb-4">
                  <div
                    className={`relative h-24 w-24 overflow-hidden rounded-full ring-4 ${rings[index]} mx-auto`}
                  >
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.displayName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white text-4xl font-bold text-gray-700">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <h3 className="mb-2 text-2xl font-bold text-white drop-shadow-md">
                  {user.displayName}
                </h3>

                {user.location && <p className="mb-3 text-sm text-white/90">📍 {user.location}</p>}

                {/* PXP */}
                <div className="mb-4 rounded-lg bg-white/20 p-4 backdrop-blur-sm">
                  <div className="text-4xl font-black text-white drop-shadow-lg">
                    {user.totalPXPEarned.toLocaleString()}
                  </div>
                  <div className="text-sm font-semibold text-white/90">PXP Earned</div>
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-4 text-sm text-white/90">
                  <div>
                    <div className="font-bold text-white">{user.venuesDiscovered}</div>
                    <div>Venues</div>
                  </div>
                </div>

                {/* Badges */}
                {user.badges.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {user.badges.slice(0, 3).map((badge, badgeIndex) => (
                      <span
                        key={badgeIndex}
                        className="rounded-full bg-white/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
                        title={badge}
                      >
                        {badge.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rank Badge */}
                <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-gray-700 shadow-lg">
                  #{rank}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
