import { Metadata } from 'next'
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable'
import { getDb } from '@/lib/get-db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'PXP Leaderboard | GlobalPiano.Network',
  description:
    'See who has earned the most PXP points in our piano community. Track your progress and compete with other piano enthusiasts.',
  openGraph: {
    title: 'PXP Leaderboard | GlobalPiano.Network',
    description: 'Top contributors ranked by PXP earned in the piano community',
    type: 'website',
  },
}

async function getCommunityStats() {
  try {
    const db = await getDb()
    const [totalPXPResult, activeContributors, venuesDiscovered] = await Promise.all([
      db.user.aggregate({ _sum: { totalPXPEarned: true } }),
      db.user.count({ where: { totalPXPEarned: { gt: 0 } } }),
      db.venue.count({ where: { isActive: true, verified: true } }),
    ])
    return {
      totalPXP: totalPXPResult._sum.totalPXPEarned ?? 0,
      activeContributors,
      venuesDiscovered,
    }
  } catch {
    return { totalPXP: 0, activeContributors: 0, venuesDiscovered: 0 }
  }
}

export default async function LeaderboardPage() {
  const stats = await getCommunityStats()
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl dark:text-white">
          🏆 PXP Leaderboard
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Top contributors ranked by PXP (Piano Experience Points) earned through discovering
          venues, writing reviews, and engaging with the community
        </p>
      </div>

      {/* Community Stats Banner */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-6 text-center dark:border-gray-700 dark:from-blue-900/20 dark:to-gray-800">
          <div className="mb-2 text-4xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalPXP.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total PXP in Community
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-white p-6 text-center dark:border-gray-700 dark:from-purple-900/20 dark:to-gray-800">
          <div className="mb-2 text-4xl font-bold text-purple-600 dark:text-purple-400">
            {stats.activeContributors.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Active Contributors
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-white p-6 text-center dark:border-gray-700 dark:from-green-900/20 dark:to-gray-800">
          <div className="mb-2 text-4xl font-bold text-green-600 dark:text-green-400">
            {stats.venuesDiscovered.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Venues Verified
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 text-3xl">💡</div>
          <div>
            <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-200">How to Earn PXP</h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
              <li>• Discover and submit new piano venues</li>
              <li>• Write detailed reviews of venues you've visited</li>
              <li>• Get your venue submissions verified by curators</li>
              <li>• Attend and host piano events</li>
              <li>• Refer friends to join the community</li>
            </ul>
            <p className="mt-3 text-xs text-blue-700 dark:text-blue-400">
              💡 Tip: Make your profile public and enable "Show PXP balance" in your settings to
              appear on the leaderboard
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <LeaderboardTable initialPage={1} />

      {/* Footer Info */}
      <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">🔒 Privacy Matters</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Only users who have set their profile to public AND enabled "Show PXP balance" appear on
          this leaderboard. You can manage your privacy settings in your profile page.
        </p>
      </div>
    </div>
  )
}
