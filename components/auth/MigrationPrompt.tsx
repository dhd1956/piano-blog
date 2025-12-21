'use client'

/**
 * MigrationPrompt Component
 *
 * Prompts wallet-only users to add username/password for better account security
 * Shows a banner with option to upgrade account to support multiple login methods
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import AddCredentialsForm from './AddCredentialsForm'

interface MigrationPromptProps {
  className?: string
}

export default function MigrationPrompt({ className = '' }: MigrationPromptProps) {
  const { user, hasWallet, isAuthenticated } = useAuth()

  const [showPrompt, setShowPrompt] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Check if user is wallet-only (has wallet but no username/password)
  const isWalletOnlyUser = isAuthenticated && hasWallet && !user?.username

  useEffect(() => {
    // Check localStorage for dismissal
    const dismissedUntil = localStorage.getItem('migrationPromptDismissedUntil')

    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil)
      if (dismissedDate > new Date()) {
        setDismissed(true)
        return
      }
    }

    // Show prompt if user is wallet-only and hasn't dismissed
    if (isWalletOnlyUser && !dismissed) {
      setShowPrompt(true)
    } else {
      setShowPrompt(false)
    }
  }, [isWalletOnlyUser, dismissed])

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)

    // Dismiss for 7 days
    const dismissUntil = new Date()
    dismissUntil.setDate(dismissUntil.getDate() + 7)
    localStorage.setItem('migrationPromptDismissedUntil', dismissUntil.toISOString())
  }

  const handleUpgradeClick = () => {
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setShowPrompt(false)
    // Clear dismissal since user has upgraded
    localStorage.removeItem('migrationPromptDismissedUntil')
  }

  // Don't show anything if not applicable
  if (!showPrompt && !showForm) return null

  return (
    <div className={`${className}`}>
      {showForm ? (
        // Show the add credentials form
        <div className="mb-6">
          <AddCredentialsForm
            walletAddress={user?.walletAddress || ''}
            onSuccess={handleFormSuccess}
          />
          <button
            onClick={() => setShowForm(false)}
            className="mt-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to prompt
          </button>
        </div>
      ) : (
        // Show the prompt banner
        <div className="mb-6 rounded-lg border-2 border-yellow-400 bg-yellow-50 p-6 dark:border-yellow-600 dark:bg-yellow-900/20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <svg
                  className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                  Secure Your Account
                </h3>
              </div>

              <p className="mt-2 text-yellow-800 dark:text-yellow-200">
                You're currently using wallet-only login.{' '}
                <strong>Add a username and password</strong> to:
              </p>

              <ul className="mt-3 ml-6 list-disc space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                <li>Log in without needing your wallet</li>
                <li>Access your account from any device</li>
                <li>Recover your account if you lose wallet access</li>
                <li>Choose between wallet or password login</li>
              </ul>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleUpgradeClick}
                  className="rounded-lg bg-yellow-600 px-6 py-2 font-medium text-white hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                >
                  Upgrade Account Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-yellow-700 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-200"
                >
                  Remind me later
                </button>
              </div>

              <p className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
                This is optional but highly recommended for account security.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
