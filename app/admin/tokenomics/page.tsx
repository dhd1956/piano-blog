'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'

export const dynamic = 'force-dynamic'

interface ChainStats {
  totalSupply: number
  totalBurned: number
  contractBalance: number
  circulatingSupply: number
}

interface DbStats {
  totalEarnedRecorded: number
  usersWithWallet: number
  totalTipsAmount: number
  totalTipsCount: number
}

interface ReconciliationRow {
  id: number
  walletAddress: string | null
  displayName: string | null
  role: string
  dbEarned: number
  onChainBalance: number
  drift: number
  flag: boolean
}

interface TokenomicsData {
  chain: ChainStats
  db: DbStats
  reconciliation: ReconciliationRow[]
  flaggedCount: number
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals })
}

function shortAddr(addr: string | null) {
  if (!addr) return '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function TokenomicsPage() {
  const { user } = useAuth()
  const isBlogOwner = user?.role === 'BLOG_OWNER'

  const [data, setData] = useState<TokenomicsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'flagged'>('all')
  const [sortBy, setSortBy] = useState<'dbEarned' | 'onChainBalance' | 'drift'>('dbEarned')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/tokenomics', { credentials: 'include' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load')
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isBlogOwner) load()
  }, [isBlogOwner, load])

  if (!isBlogOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Access restricted to blog owner.</p>
      </div>
    )
  }

  const rows = data
    ? (filter === 'flagged' ? data.reconciliation.filter((r) => r.flag) : data.reconciliation).sort(
        (a, b) => b[sortBy] - a[sortBy]
      )
    : []

  const earnBurnRatio =
    data && data.chain.totalBurned > 0
      ? (data.db.totalEarnedRecorded / data.chain.totalBurned).toFixed(2)
      : '∞'

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🔥 PXP Tokenomics</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              On-chain vs database reconciliation
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="py-20 text-center text-gray-500">Fetching chain data…</div>
        )}

        {data && (
          <>
            {/* Supply cards */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                label="Total Supply"
                value={fmt(data.chain.totalSupply)}
                sub="PXP minted"
                color="blue"
              />
              <StatCard
                label="Circulating"
                value={fmt(data.chain.circulatingSupply)}
                sub="excl. contract reserves"
                color="green"
              />
              <StatCard
                label="Total Burned 🔥"
                value={fmt(data.chain.totalBurned)}
                sub={`${((data.chain.totalBurned / data.chain.totalSupply) * 100).toFixed(3)}% of supply`}
                color="red"
              />
              <StatCard
                label="Contract Reserves"
                value={fmt(data.chain.contractBalance)}
                sub="rewards pool"
                color="yellow"
              />
            </div>

            {/* Activity cards */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                label="DB Earned (total)"
                value={fmt(data.db.totalEarnedRecorded)}
                sub="sum of all user records"
                color="purple"
              />
              <StatCard
                label="Tips Sent"
                value={fmt(data.db.totalTipsAmount)}
                sub={`${data.db.totalTipsCount} transactions`}
                color="orange"
              />
              <StatCard
                label="Users w/ Wallet"
                value={String(data.db.usersWithWallet)}
                sub="wallet addresses on file"
                color="gray"
              />
              <StatCard
                label="Earn/Burn Ratio"
                value={earnBurnRatio}
                sub="target: 1.0–1.2"
                color={
                  earnBurnRatio === '∞' || parseFloat(earnBurnRatio) > 2
                    ? 'red'
                    : parseFloat(earnBurnRatio) <= 1.2
                      ? 'green'
                      : 'yellow'
                }
              />
            </div>

            {/* Flag banner */}
            {data.flaggedCount > 0 && (
              <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
                <p className="font-medium text-red-700 dark:text-red-300">
                  ⚠️ {data.flaggedCount} user{data.flaggedCount !== 1 ? 's' : ''} with on-chain
                  balance exceeding DB recorded earnings — possible missed reward write.
                </p>
              </div>
            )}

            {/* Reconciliation table */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Per-user reconciliation
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (top 100 by wallet)
                  </span>
                </h2>
                <div className="flex gap-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as 'all' | 'flagged')}
                    className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All users</option>
                    <option value="flagged">Flagged only ({data.flaggedCount})</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'dbEarned' | 'onChainBalance' | 'drift')
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="dbEarned">Sort: DB earned</option>
                    <option value="onChainBalance">Sort: On-chain balance</option>
                    <option value="drift">Sort: Drift</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Wallet</th>
                      <th className="px-4 py-3 text-right">DB Earned</th>
                      <th className="px-4 py-3 text-right">On-chain Balance</th>
                      <th className="px-4 py-3 text-right">Drift</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                          No users
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={row.id}
                          className={`${row.flag ? 'bg-red-50 dark:bg-red-900/10' : 'dark:hover:bg-gray-750 hover:bg-gray-50'}`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {row.displayName || `User #${row.id}`}
                            </div>
                            <div className="text-xs text-gray-400">{row.role}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                            {shortAddr(row.walletAddress)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 tabular-nums dark:text-gray-300">
                            {fmt(row.dbEarned)} PXP
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 tabular-nums dark:text-gray-300">
                            {fmt(row.onChainBalance)} PXP
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-medium tabular-nums ${
                              row.drift > 0.01
                                ? 'text-red-600 dark:text-red-400'
                                : row.drift < -0.01
                                  ? 'text-gray-400'
                                  : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {row.drift > 0 ? '+' : ''}
                            {fmt(row.drift)} PXP
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.flag ? (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                ⚠ Check
                              </span>
                            ) : (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                ✓ OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-400 dark:border-gray-700">
                Drift = on-chain balance − DB earned. Negative drift is normal (user spent PXP).
                Positive drift means on-chain &gt; recorded earnings — investigate.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'gray'
}) {
  const border = {
    blue: 'border-blue-200 dark:border-blue-800',
    green: 'border-green-200 dark:border-green-800',
    red: 'border-red-200 dark:border-red-800',
    yellow: 'border-yellow-200 dark:border-yellow-800',
    purple: 'border-purple-200 dark:border-purple-800',
    orange: 'border-orange-200 dark:border-orange-800',
    gray: 'border-gray-200 dark:border-gray-700',
  }[color]

  const valueColor = {
    blue: 'text-blue-700 dark:text-blue-300',
    green: 'text-green-700 dark:text-green-300',
    red: 'text-red-700 dark:text-red-300',
    yellow: 'text-yellow-700 dark:text-yellow-300',
    purple: 'text-purple-700 dark:text-purple-300',
    orange: 'text-orange-700 dark:text-orange-300',
    gray: 'text-gray-700 dark:text-gray-300',
  }[color]

  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800 ${border}`}>
      <p className="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
    </div>
  )
}
