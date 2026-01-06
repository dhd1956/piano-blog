'use client'

import { useState, useEffect } from 'react'
import LeaderboardEntry from './LeaderboardEntry'
import TopThreeSpotlight from './TopThreeSpotlight'
import CurrentUserCard from './CurrentUserCard'
import type { LeaderboardResponse } from '@/types/leaderboard'

interface LeaderboardTableProps {
  initialPage?: number
}

export default function LeaderboardTable({ initialPage = 1 }: LeaderboardTableProps) {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(initialPage)

  useEffect(() => {
    fetchLeaderboard()
  }, [page])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/leaderboard?page=${page}&limit=50`)

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Leaderboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <div className="mb-2 text-4xl">😞</div>
        <h3 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-200">
          Failed to Load Leaderboard
        </h3>
        <p className="mb-4 text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 text-6xl">🏆</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          No Leaderboard Entries Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Be the first to earn PXP and claim your spot on the leaderboard!
        </p>
      </div>
    )
  }

  const topThree = data.leaderboard.slice(0, 3)
  const remaining = data.leaderboard.slice(3)

  return (
    <div>
      {/* Current User Card (if authenticated) */}
      {data.currentUser && <CurrentUserCard currentUser={data.currentUser} />}

      {/* Top Three Spotlight */}
      {topThree.length > 0 && <TopThreeSpotlight users={topThree} />}

      {/* Remaining Entries */}
      {remaining.length > 0 && (
        <div className="space-y-3">
          <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">All Rankings</h3>
          {remaining.map((user) => (
            <LeaderboardEntry
              key={user.userId}
              user={user}
              isCurrentUser={data.currentUser?.entry.userId === user.userId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            ← Previous
          </button>

          <span className="text-gray-700 dark:text-gray-300">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.pagination.hasMore || loading}
            className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Next →
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
        </div>
      )}
    </div>
  )
}
