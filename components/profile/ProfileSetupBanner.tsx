'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAppKit } from '@reown/appkit/react'

interface ProfileSetupBannerProps {
  walletAddress: string
  hasDisplayName: boolean
  hasUsername: boolean
  hasEmail: boolean
  hasWallet?: boolean // Optional: whether user has linked a wallet
  pxpBalance?: number // Optional: user's PXP balance to show incentive
}

export default function ProfileSetupBanner({
  walletAddress,
  hasDisplayName,
  hasUsername,
  hasEmail,
  hasWallet = true, // Default to true to avoid showing if not provided
  pxpBalance = 0,
}: ProfileSetupBannerProps) {
  const { open } = useAppKit()
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

  const handleLinkWallet = async () => {
    await open()
  }

  const showWalletOption = !hasWallet && pxpBalance > 0

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

          {/* Optional: Wallet linking section */}
          {showWalletOption && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-600 dark:text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Optional: Link Wallet to Claim {pxpBalance.toLocaleString()} PXP
                  </p>
                  <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                    You've earned PXP rewards! Link a wallet to claim them on-chain (no gas fees
                    required).
                  </p>
                  <button
                    onClick={handleLinkWallet}
                    className="mt-2 text-xs font-medium text-green-700 underline hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
                  >
                    Link Wallet Now →
                  </button>
                </div>
              </div>
            </div>
          )}

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
