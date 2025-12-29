'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

interface GasMetrics {
  isEnabled: boolean
  totalTransactionsToday: number
  totalTransactionsWeek: number
  totalTransactionsMonth: number
  costToday: number
  costWeek: number
  costMonth: number
  paymasterBalance: number
  transactionsByType: Record<string, number>
  topUsers: Array<{
    userId: number
    username: string
    transactionCount: number
    estimatedCost: number
  }>
  budgetStatus: {
    dailyLimit: number
    monthlyLimit: number
    dailyUsed: number
    monthlyUsed: number
    alertThreshold: number
  }
}

export default function GasSponsorshipDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<GasMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (user && user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    if (user && user.role === 'ADMIN') {
      fetchMetrics()
    }
  }, [user, isAuthenticated, isLoading, router])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/gas-metrics')

      if (!response.ok) {
        throw new Error('Failed to fetch gas metrics')
      }

      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics')
      // Show demo data if API fails (useful for development)
      setMetrics(getDemoMetrics())
    } finally {
      setLoading(false)
    }
  }

  // Demo metrics for when gas sponsorship is not active
  const getDemoMetrics = (): GasMetrics => {
    const isEnabled = !!process.env.NEXT_PUBLIC_PAYMASTER_URL

    return {
      isEnabled,
      totalTransactionsToday: isEnabled ? 0 : 12,
      totalTransactionsWeek: isEnabled ? 0 : 78,
      totalTransactionsMonth: isEnabled ? 0 : 324,
      costToday: isEnabled ? 0 : 0.18,
      costWeek: isEnabled ? 0 : 1.24,
      costMonth: isEnabled ? 0 : 5.87,
      paymasterBalance: isEnabled ? 0 : 94.13,
      transactionsByType: {
        submitVenue: 145,
        rsvpToEvent: 89,
        updateProfile: 54,
        createEvent: 24,
        verifyVenue: 12,
      },
      topUsers: [
        { userId: 1, username: 'daved', transactionCount: 45, estimatedCost: 0.68 },
        { userId: 2, username: 'scout_alice', transactionCount: 32, estimatedCost: 0.51 },
        { userId: 3, username: 'curator_bob', transactionCount: 28, estimatedCost: 0.42 },
      ],
      budgetStatus: {
        dailyLimit: 10,
        monthlyLimit: 300,
        dailyUsed: 0.18,
        monthlyUsed: 5.87,
        alertThreshold: 0.75,
      },
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading gas sponsorship metrics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Failed to load metrics</p>
        </div>
      </div>
    )
  }

  const isDailyBudgetWarning =
    metrics.budgetStatus.dailyUsed / metrics.budgetStatus.dailyLimit >
    metrics.budgetStatus.alertThreshold
  const isMonthlyBudgetWarning =
    metrics.budgetStatus.monthlyUsed / metrics.budgetStatus.monthlyLimit >
    metrics.budgetStatus.alertThreshold

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Gas Sponsorship Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor transaction costs and usage patterns
        </p>
      </div>

      {/* Status Banner */}
      <div
        className={`mb-8 rounded-lg p-4 ${metrics.isEnabled ? 'border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-2 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'}`}
      >
        <div className="flex items-center gap-3">
          {metrics.isEnabled ? (
            <>
              <span className="text-2xl">⚡</span>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Gas Sponsorship: ENABLED
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Platform is sponsoring transaction fees via Pimlico
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Gas Sponsorship: DISABLED (Demo Mode)
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Showing sample data. Activate via{' '}
                  <code className="rounded bg-yellow-200 px-1 dark:bg-yellow-800">
                    NEXT_PUBLIC_PAYMASTER_URL
                  </code>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cost Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Today"
          value={`$${metrics.costToday.toFixed(2)}`}
          subtitle={`${metrics.totalTransactionsToday} transactions`}
          icon="📊"
        />
        <MetricCard
          title="This Week"
          value={`$${metrics.costWeek.toFixed(2)}`}
          subtitle={`${metrics.totalTransactionsWeek} transactions`}
          icon="📈"
        />
        <MetricCard
          title="This Month"
          value={`$${metrics.costMonth.toFixed(2)}`}
          subtitle={`${metrics.totalTransactionsMonth} transactions`}
          icon="💰"
        />
        <MetricCard
          title="Paymaster Balance"
          value={`$${metrics.paymasterBalance.toFixed(2)}`}
          subtitle={metrics.paymasterBalance < 20 ? '⚠️ Low balance' : '✅ Healthy'}
          icon="💳"
          alert={metrics.paymasterBalance < 20}
        />
      </div>

      {/* Budget Status */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily Budget */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Daily Budget Status
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Used</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ${metrics.budgetStatus.dailyUsed.toFixed(2)} / $
                {metrics.budgetStatus.dailyLimit.toFixed(2)}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-3 rounded-full transition-all ${isDailyBudgetWarning ? 'bg-red-500' : 'bg-green-500'}`}
                style={{
                  width: `${Math.min((metrics.budgetStatus.dailyUsed / metrics.budgetStatus.dailyLimit) * 100, 100)}%`,
                }}
              />
            </div>
            {isDailyBudgetWarning && (
              <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                ⚠️ Approaching daily limit (
                {((metrics.budgetStatus.dailyUsed / metrics.budgetStatus.dailyLimit) * 100).toFixed(
                  0
                )}
                %)
              </p>
            )}
          </div>
        </div>

        {/* Monthly Budget */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Monthly Budget Status
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Used</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ${metrics.budgetStatus.monthlyUsed.toFixed(2)} / $
                {metrics.budgetStatus.monthlyLimit.toFixed(2)}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-3 rounded-full transition-all ${isMonthlyBudgetWarning ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{
                  width: `${Math.min((metrics.budgetStatus.monthlyUsed / metrics.budgetStatus.monthlyLimit) * 100, 100)}%`,
                }}
              />
            </div>
            {isMonthlyBudgetWarning && (
              <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                ⚠️ Approaching monthly limit (
                {(
                  (metrics.budgetStatus.monthlyUsed / metrics.budgetStatus.monthlyLimit) *
                  100
                ).toFixed(0)}
                %)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Transactions by Type */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Transactions by Type
        </h2>
        <div className="space-y-3">
          {Object.entries(metrics.transactionsByType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 capitalize dark:text-gray-400">
                {type.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <div className="flex items-center gap-3">
                <div className="h-2 w-32 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${(count / Math.max(...Object.values(metrics.transactionsByType))) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-right font-medium text-gray-900 dark:text-gray-100">
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Users */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Top Users by Gas Consumption
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  User
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Transactions
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Est. Cost
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.topUsers.map((user, index) => (
                <tr key={user.userId} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">#{index + 1}</span>
                      <span className="font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-sm text-gray-900 dark:text-gray-100">
                    {user.transactionCount}
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                    ${user.estimatedCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchMetrics}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  alert = false,
}: {
  title: string
  value: string
  subtitle: string
  icon: string
  alert?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-6 shadow-sm ${
        alert
          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p
        className={`mb-1 text-2xl font-bold ${alert ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}
      >
        {value}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  )
}
