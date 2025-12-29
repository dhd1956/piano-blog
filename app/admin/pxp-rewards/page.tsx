'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

interface PXPConfigItem {
  id: number
  key: string
  value: number
  label: string
  description: string | null
  category: string
  enabled: boolean
}

interface GroupedConfigs {
  [category: string]: PXPConfigItem[]
}

export default function PXPRewardsAdminPage() {
  const { user, isAuthenticated } = useAuth()
  const [configs, setConfigs] = useState<PXPConfigItem[]>([])
  const [groupedConfigs, setGroupedConfigs] = useState<GroupedConfigs>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [editedValues, setEditedValues] = useState<Record<string, number>>({})

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfigs()
    }
  }, [isAuthenticated])

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/pxp-config-db', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch PXP configuration')
      }

      const data = await response.json()
      setConfigs(data.configs)
      setGroupedConfigs(data.groupedConfigs)

      // Initialize edited values
      const initialValues: Record<string, number> = {}
      data.configs.forEach((config: PXPConfigItem) => {
        initialValues[config.key] = config.value
      })
      setEditedValues(initialValues)

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration')
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Build updates array
      const updates = Object.keys(editedValues).map((key) => ({
        key,
        value: editedValues[key],
        enabled: configs.find((c) => c.key === key)?.enabled ?? true,
      }))

      const response = await fetch('/api/admin/pxp-config-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update configuration')
      }

      setSuccess(true)
      await fetchConfigs() // Refresh data

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleValueChange = (key: string, value: number) => {
    setEditedValues((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const hasChanges = () => {
    return configs.some((config) => editedValues[config.key] !== config.value)
  }

  if (!isAuthenticated || (user?.role !== 'BLOG_OWNER' && user?.role !== 'ADMIN')) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p>You must be an administrator to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">PXP Rewards Configuration</h1>
        <div className="rounded-lg border border-gray-300 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">PXP Rewards Configuration</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure Piano Experience Points rewards for community actions
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 rounded-lg border border-green-300 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400">
          <p className="font-semibold">✓ Success!</p>
          <p>Reward amounts updated successfully</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Configuration Sections by Category */}
      <div className="space-y-8">
        {Object.entries(groupedConfigs).map(([category, items]) => (
          <div
            key={category}
            className="rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
          >
            <h2 className="mb-4 text-xl font-semibold capitalize">{category} Rewards</h2>
            <div className="space-y-4">
              {items.map((config) => (
                <div key={config.key} className="flex items-start gap-4">
                  <div className="flex-1">
                    <label htmlFor={config.key} className="block font-medium">
                      {config.label}
                    </label>
                    {config.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {config.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      id={config.key}
                      value={editedValues[config.key] ?? config.value}
                      onChange={(e) => handleValueChange(config.key, Number(e.target.value))}
                      min={0}
                      max={10000}
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-right dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">PXP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end gap-4">
        <button
          type="button"
          onClick={fetchConfigs}
          className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges() || saving}
          className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Info Note */}
      <div className="mt-8 rounded-lg border border-blue-300 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-900/20">
        <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">
          ℹ️ About PXP Rewards
        </h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-400">
          <li>These rewards are tracked in the database and awarded automatically</li>
          <li>Users accumulate PXP and can claim them to the blockchain when ready</li>
          <li>Changes take effect immediately after saving</li>
          <li>Set to 0 to disable a specific reward type</li>
          <li>For blockchain rewards (New User, Scout, Verifier), see the main PXP Config page</li>
        </ul>
      </div>
    </div>
  )
}
