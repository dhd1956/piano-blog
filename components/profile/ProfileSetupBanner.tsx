'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ProfileSetupBannerProps {
  walletAddress: string
  hasDisplayName: boolean
  hasUsername: boolean
  hasEmail: boolean
}

export default function ProfileSetupBanner({
  walletAddress,
  hasDisplayName,
  hasUsername,
  hasEmail,
}: ProfileSetupBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Check if banner was dismissed in localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem(`profile-setup-dismissed-${walletAddress}`)
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [walletAddress])

  const handleDismiss = () => {
    localStorage.setItem(`profile-setup-dismissed-${walletAddress}`, 'true')
    setIsDismissed(true)
  }

  // Don't show if all fields are complete or if dismissed
  if ((hasDisplayName && hasUsername && hasEmail) || isDismissed) {
    return null
  }

  const missingFields: string[] = []
  if (!hasDisplayName) missingFields.push('Display Name')
  if (!hasUsername) missingFields.push('Username')
  if (!hasEmail) missingFields.push('Email')

  return (
    <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm dark:border-blue-800 dark:bg-blue-900/20">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Complete Your Profile
            </h3>
          </div>

          <p className="mb-4 text-sm text-blue-800 dark:text-blue-200">
            You're missing some profile information. Complete your profile to help others connect
            with you and improve your experience!
          </p>

          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">Missing:</p>
            <div className="flex flex-wrap gap-2">
              {missingFields.map((field) => (
                <span
                  key={field}
                  className="rounded-full bg-blue-200 px-3 py-1 text-xs font-medium text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/profile/${walletAddress}/edit`}
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Complete Profile
            </Link>
            <button
              onClick={handleDismiss}
              className="rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:bg-gray-800 dark:text-blue-300 dark:hover:bg-gray-700"
            >
              Remind Me Later
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="ml-4 text-blue-400 hover:text-blue-600"
          aria-label="Dismiss banner"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
