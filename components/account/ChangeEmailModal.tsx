'use client'

import { useState } from 'react'

interface ChangeEmailModalProps {
  userId: number
  currentEmail: string | null
  onClose: () => void
  onSuccess: () => void
}

/**
 * ChangeEmailModal Component
 *
 * Modal for users to change their email address.
 * Sends verification email to new address and security alert to old address.
 */
export default function ChangeEmailModal({
  userId,
  currentEmail,
  onClose,
  onSuccess,
}: ChangeEmailModalProps) {
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newEmail)) {
        throw new Error('Please enter a valid email address')
      }

      // Call API to change email
      const response = await fetch('/api/account/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          newEmail,
          currentEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change email')
      }

      setSuccess(true)

      // Close modal after 2 seconds
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {currentEmail ? 'Change Email Address' : 'Add Email Address'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none dark:hover:bg-gray-700"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        {!success ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {currentEmail && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-xs text-gray-600 dark:text-gray-400">Current Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {currentEmail}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="newEmail"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                New Email Address
              </label>
              <input
                type="email"
                id="newEmail"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="your.new.email@example.com"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                We'll send you a verification email to confirm your new address
                {currentEmail && ' and a security alert to your current address'}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Changing...' : currentEmail ? 'Change Email' : 'Add Email'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-10 w-10 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Email {currentEmail ? 'Changed' : 'Added'} Successfully!
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Please check your inbox to verify your new email address.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
