'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { usePermissions } from '@/components/web3/WorkingWeb3Provider'
import WalletConnection from '@/components/web3/WalletConnection'

interface Curator {
  id: number
  walletAddress: string
  username: string | null
  displayName: string | null
  avatar: string | null
  createdAt: string
  updatedAt: string
}

export default function CuratorManagementPage() {
  const { isConnected, walletAddress } = useWallet()
  const { isBlogOwner } = usePermissions()

  const [curators, setCurators] = useState<Curator[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [newCuratorAddress, setNewCuratorAddress] = useState('')
  const [addingCurator, setAddingCurator] = useState(false)

  // Load curators
  const loadCurators = async () => {
    if (!walletAddress) return

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/curators', {
        headers: {
          'x-wallet-address': walletAddress,
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to load curators')
      }

      setCurators(data.curators)
    } catch (error: any) {
      console.error('Error loading curators:', error)
      setError('Failed to load curators: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Add curator
  const handleAddCurator = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newCuratorAddress.trim() || !walletAddress) {
      setError('Please enter a valid wallet address')
      return
    }

    try {
      setAddingCurator(true)
      setError('')
      setSuccessMessage('')

      const response = await fetch('/api/admin/curators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          curatorAddress: newCuratorAddress.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to add curator')
      }

      setSuccessMessage(`Curator added successfully!`)
      setNewCuratorAddress('')
      await loadCurators()
    } catch (error: any) {
      console.error('Error adding curator:', error)
      setError('Failed to add curator: ' + error.message)
    } finally {
      setAddingCurator(false)
    }
  }

  // Remove curator
  const handleRemoveCurator = async (curatorAddress: string) => {
    if (!walletAddress) return

    const confirmed = window.confirm(
      `Are you sure you want to remove curator permissions for ${curatorAddress}?`
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccessMessage('')

      const response = await fetch(`/api/admin/curators/${encodeURIComponent(curatorAddress)}`, {
        method: 'DELETE',
        headers: {
          'x-wallet-address': walletAddress,
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to remove curator')
      }

      setSuccessMessage('Curator removed successfully!')
      await loadCurators()
    } catch (error: any) {
      console.error('Error removing curator:', error)
      setError('Failed to remove curator: ' + error.message)
    }
  }

  // Load curators when connected
  useEffect(() => {
    if (isConnected && isBlogOwner) {
      loadCurators()
    }
  }, [isConnected, isBlogOwner])

  // Clear messages after delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 8000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">👥 Curator Management</h1>
          <p className="mb-8 text-gray-600">Connect your wallet to manage authorized curators.</p>
          <div className="mx-auto max-w-sm">
            <WalletConnection size="lg" showNetworkStatus={true} />
          </div>
        </div>
      </div>
    )
  }

  // Not blog owner
  if (!isBlogOwner) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">👥 Curator Management</h1>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-red-800">
              ⛔ Access Denied: Only the blog owner can manage curators.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Authorized - show management interface
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">👥 Curator Management</h1>
          <p className="text-gray-600">
            Manage authorized curators who can verify and moderate venues.
          </p>

          <div className="mt-4">
            <WalletConnection
              showFullAddress={false}
              showNetworkStatus={true}
              showPermissions={true}
            />
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="text-green-800">✅ {successMessage}</div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-red-800">❌ {error}</div>
          </div>
        )}

        {/* Add Curator Form */}
        <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-md">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">Add New Curator</h2>
            <p className="mt-1 text-sm text-gray-600">
              Enter the wallet address of the user you want to authorize as a curator.
            </p>
          </div>

          <form onSubmit={handleAddCurator} className="p-6">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Wallet Address</label>
              <input
                type="text"
                value={newCuratorAddress}
                onChange={(e) => setNewCuratorAddress(e.target.value)}
                placeholder="0x..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={addingCurator}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be a valid Ethereum wallet address (0x followed by 40 hexadecimal characters)
              </p>
            </div>

            <button
              type="submit"
              disabled={addingCurator || !newCuratorAddress.trim()}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addingCurator ? 'Adding...' : 'Add Curator'}
            </button>
          </form>
        </div>

        {/* Curators List */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">Authorized Curators</h2>
            <p className="mt-1 text-sm text-gray-600">
              {curators.length} curator{curators.length !== 1 ? 's' : ''} authorized
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading curators...</p>
            </div>
          ) : curators.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No curators found. Add your first curator above.
            </div>
          ) : (
            <div className="divide-y">
              {curators.map((curator) => (
                <div key={curator.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        {curator.avatar && (
                          <img
                            src={curator.avatar}
                            alt={curator.displayName || curator.username || 'Curator'}
                            className="h-10 w-10 rounded-full"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">
                            {curator.displayName || curator.username || 'Anonymous Curator'}
                          </h3>
                          {curator.username && curator.displayName && (
                            <p className="text-sm text-gray-500">@{curator.username}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="font-mono">📍 {curator.walletAddress}</p>
                        <p>Added: {new Date(curator.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={() => handleRemoveCurator(curator.walletAddress)}
                        className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold text-blue-900">ℹ️ What can curators do?</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
            <li>Access the curator dashboard at /curator</li>
            <li>Verify or reject submitted venues</li>
            <li>Edit venue information</li>
            <li>Review and moderate content</li>
          </ul>
          <p className="mt-3 text-sm text-blue-800">
            <strong>Note:</strong> Only the blog owner can delete venues and manage curators.
          </p>
        </div>
      </div>
    </div>
  )
}
