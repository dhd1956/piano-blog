'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ProfileProgressProps {
  user: {
    id: number
    displayName?: string | null
    email?: string | null
    emailVerified: boolean
    bio?: string | null
    avatar?: string | null
    location?: string | null
    walletAddress?: string | null
    username?: string | null
  }
  hasMusicianProfile: boolean
  onDismiss?: () => void
}

export default function ProfileProgress({
  user,
  hasMusicianProfile,
  onDismiss,
}: ProfileProgressProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Calculate profile completion
  const checks = {
    hasDisplayName: !!user.displayName,
    hasEmail: !!user.email,
    hasEmailVerified: user.emailVerified,
    hasBio: !!user.bio,
    hasAvatar: !!user.avatar,
    hasLocation: !!user.location,
    hasMusicianProfile: hasMusicianProfile,
  }

  const completedChecks = Object.values(checks).filter(Boolean).length
  const totalChecks = Object.keys(checks).length
  const completionPercentage = Math.round((completedChecks / totalChecks) * 100)

  const handleDismiss = () => {
    setIsDismissed(true)
    if (onDismiss) {
      onDismiss()
    }
  }

  if (isDismissed || completionPercentage === 100) {
    return null
  }

  const profileUrl = `/profile/${user.walletAddress || user.username}`

  return (
    <div className="mb-6 rounded-lg border-2 border-blue-500 bg-blue-50 p-6 dark:bg-blue-900/20">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
              Complete Your Profile
            </h3>
            <button
              onClick={handleDismiss}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              aria-label="Dismiss profile completion reminder"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {completionPercentage}% complete
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {completedChecks} of {totalChecks} items
              </span>
            </div>
            <div className="h-3 rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-3 rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-200">
              Complete your profile to:
            </p>
            <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Appear in the musician directory
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Get discovered by event organizers
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Build credibility in the community
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Unlock all platform features
              </li>
            </ul>
          </div>

          {/* Checklist */}
          <div className="mb-4 space-y-2">
            <p className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-200">
              To-do checklist:
            </p>

            {!checks.hasDisplayName && (
              <div className="flex items-center justify-between rounded bg-white/50 px-3 py-2 dark:bg-gray-800/50">
                <span className="text-sm text-blue-800 dark:text-blue-200">Add display name</span>
                <Link
                  href={profileUrl}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Edit →
                </Link>
              </div>
            )}

            {!checks.hasAvatar && (
              <div className="flex items-center justify-between rounded bg-white/50 px-3 py-2 dark:bg-gray-800/50">
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  Upload profile photo
                </span>
                <Link
                  href={profileUrl}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Upload →
                </Link>
              </div>
            )}

            {!checks.hasBio && (
              <div className="flex items-center justify-between rounded bg-white/50 px-3 py-2 dark:bg-gray-800/50">
                <span className="text-sm text-blue-800 dark:text-blue-200">Write bio</span>
                <Link
                  href={profileUrl}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Edit →
                </Link>
              </div>
            )}

            {!checks.hasLocation && (
              <div className="flex items-center justify-between rounded bg-white/50 px-3 py-2 dark:bg-gray-800/50">
                <span className="text-sm text-blue-800 dark:text-blue-200">Add location</span>
                <Link
                  href={profileUrl}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Edit →
                </Link>
              </div>
            )}

            {!checks.hasMusicianProfile && (
              <div className="flex items-center justify-between rounded bg-white/50 px-3 py-2 dark:bg-gray-800/50">
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  Add instruments (musicians)
                </span>
                <Link
                  href={profileUrl}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Edit →
                </Link>
              </div>
            )}

            {!checks.hasEmail && (
              <div className="flex items-center justify-between rounded bg-white/50 px-3 py-2 dark:bg-gray-800/50">
                <span className="text-sm text-blue-800 dark:text-blue-200">Add email address</span>
                <Link
                  href={profileUrl}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Add →
                </Link>
              </div>
            )}

            {checks.hasEmail && !checks.hasEmailVerified && (
              <div className="flex items-center justify-between rounded bg-white/50 px-3 py-2 dark:bg-gray-800/50">
                <span className="text-sm text-blue-800 dark:text-blue-200">Verify email</span>
                <Link
                  href="/account/settings"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Send Link →
                </Link>
              </div>
            )}
          </div>

          {/* Main CTA */}
          <Link
            href={profileUrl}
            className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white transition-colors hover:bg-blue-700"
          >
            Complete Profile Now
          </Link>
        </div>
      </div>
    </div>
  )
}
