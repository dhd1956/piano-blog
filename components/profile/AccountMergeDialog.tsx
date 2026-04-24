'use client'

import { useState } from 'react'

interface ExistingAccount {
  id: number
  walletAddress: string
  username: string | null
  displayName: string | null
  email: string
  createdAt: Date
  totalPXPEarned: number
}

interface AccountMergeDialogProps {
  existingAccount: ExistingAccount
  newWalletAddress: string
  onMerge: () => void
  onDecline: () => void
}

export default function AccountMergeDialog({
  existingAccount,
  newWalletAddress,
  onMerge,
  onDecline,
}: AccountMergeDialogProps) {
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMerge = async () => {
    setMerging(true)
    setError(null)

    try {
      const response = await fetch('/api/profile/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldUserId: existingAccount.id,
          newWalletAddress: newWalletAddress,
          requesterAddress: newWalletAddress,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to merge accounts')
      }

      // Merge successful
      onMerge()
    } catch (err) {
      console.error('Merge error:', err)
      setError(err instanceof Error ? err.message : 'Failed to merge accounts')
      setMerging(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-w-md rounded-lg border-2 border-blue-500 bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Account Merge Detected
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We found an existing account with the same email address
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Existing Account
            </h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Name:</span>{' '}
                {existingAccount.displayName ||
                  existingAccount.username ||
                  `User ${existingAccount.walletAddress.slice(2, 8)}`}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Email:</span> {existingAccount.email}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Wallet:</span>{' '}
                {existingAccount.walletAddress.slice(0, 6)}...
                {existingAccount.walletAddress.slice(-4)}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Joined:</span> {formatDate(existingAccount.createdAt)}
              </p>
              {existingAccount.totalPXPEarned > 0 && (
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">PXP:</span> {existingAccount.totalPXPEarned}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">New Wallet</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {newWalletAddress.slice(0, 6)}...{newWalletAddress.slice(-4)}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-yellow-900 dark:text-yellow-100">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            What will happen
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-yellow-900 dark:text-yellow-100">
            <li>All data from old account will transfer to your new wallet</li>
            <li>Events and PXP will be preserved</li>
            <li>Your old embedded wallet will be deleted</li>
            <li>You'll use your external wallet (MetaMask) going forward</li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleMerge}
            disabled={merging}
            className="hover:bg-primary-600 dark:hover:bg-primary-700 flex-1 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors disabled:opacity-50"
          >
            {merging ? 'Merging Accounts...' : 'Merge Accounts'}
          </button>
          <button
            onClick={onDecline}
            disabled={merging}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Keep Separate
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          This action cannot be undone. Choose carefully.
        </p>
      </div>
    </div>
  )
}
