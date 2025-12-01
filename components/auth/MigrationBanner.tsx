'use client'

import { useState, useEffect } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import AddEmailModal from './AddEmailModal'

// 7-day grace period for dismissal (in milliseconds)
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000

interface UserData {
  walletAddress: string | null
  email: string | null
  emailVerified: boolean
  createdAt: string
}

/**
 * MigrationBanner Component
 *
 * Shows a banner prompting wallet-only users to add an email for account recovery.
 * - Dismissible for 7 days
 * - Non-dismissible after grace period
 * - Only shows for wallet users without email
 */
export default function MigrationBanner() {
  const { address, isConnected } = useAppKitAccount()
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isDismissible, setIsDismissible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserStatus()
  }, [address, isConnected])

  const checkUserStatus = async () => {
    if (!isConnected || !address) {
      setShowBanner(false)
      setLoading(false)
      return
    }

    try {
      // Fetch user profile
      const response = await fetch(`/api/profile/${address}`)
      if (!response.ok) {
        setLoading(false)
        return
      }

      const data = await response.json()
      const profile = data.profile

      // Only show for wallet-only users (no email)
      if (!profile.email) {
        const createdAt = new Date(profile.createdAt)
        const accountAge = Date.now() - createdAt.getTime()
        const gracePeriodExpired = accountAge > GRACE_PERIOD_MS

        setUserData({
          walletAddress: profile.walletAddress,
          email: profile.email,
          emailVerified: profile.emailVerified || false,
          createdAt: profile.createdAt,
        })

        // Check localStorage for dismissal
        const dismissedUntil = localStorage.getItem(`email_banner_dismissed_${address}`)
        const now = Date.now()

        if (gracePeriodExpired) {
          // Grace period expired - force show banner (non-dismissible)
          setIsDismissible(false)
          setShowBanner(true)
        } else if (dismissedUntil) {
          // Check if dismissal period has expired
          const dismissedTime = parseInt(dismissedUntil, 10)
          if (now < dismissedTime) {
            setShowBanner(false) // Still dismissed
          } else {
            setShowBanner(true) // Dismissal expired, show again
            setIsDismissible(true)
          }
        } else {
          // Never dismissed - show banner
          setShowBanner(true)
          setIsDismissible(true)
        }
      } else {
        setShowBanner(false)
      }
    } catch (error) {
      console.error('Error checking user status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    if (!isDismissible || !address) return

    // Dismiss for 24 hours
    const dismissUntil = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem(`email_banner_dismissed_${address}`, dismissUntil.toString())
    setShowBanner(false)
  }

  const handleAddEmail = () => {
    setShowModal(true)
  }

  const handleEmailAdded = () => {
    setShowModal(false)
    setShowBanner(false)
    // Refresh user status
    checkUserStatus()
  }

  if (loading || !showBanner) {
    return null
  }

  return (
    <>
      {/* Banner */}
      <div
        className={`fixed top-0 right-0 left-0 z-50 ${
          isDismissible ? 'bg-blue-600' : 'bg-orange-600'
        } px-4 py-3 text-white shadow-lg`}
      >
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {isDismissible ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {isDismissible ? '🔒 Secure your account' : '⚠️ Action Required: Add Email'}
              </p>
              <p className="text-xs opacity-90">
                {isDismissible
                  ? 'Add an email to recover your account if you lose access to your wallet'
                  : 'Email is required for account recovery. Please add your email to continue using all features.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddEmail}
              className="rounded-md bg-white px-4 py-1.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-gray-100 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:outline-none"
            >
              Add Email
            </button>
            {isDismissible && (
              <button
                onClick={handleDismiss}
                className="rounded-md px-2 py-1.5 text-sm font-medium text-white hover:bg-white/10 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:outline-none"
                aria-label="Dismiss banner"
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
            )}
          </div>
        </div>
      </div>

      {/* Spacer to push content down when banner is shown */}
      <div className="h-20" />

      {/* Add Email Modal */}
      {showModal && (
        <AddEmailModal
          walletAddress={address || ''}
          onClose={() => setShowModal(false)}
          onSuccess={handleEmailAdded}
        />
      )}
    </>
  )
}
