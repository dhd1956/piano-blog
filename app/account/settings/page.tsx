'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppKitAccount } from '@reown/appkit/react'
import { useAuth } from '@/context/AuthContext'
import ChangeEmailModal from '@/components/account/ChangeEmailModal'

interface UserProfile {
  id: number
  username: string | null
  walletAddress: string | null
  email: string | null
  emailVerified: boolean
  displayName: string | null
}

export default function AccountSettingsPage() {
  const router = useRouter()
  const { address, isConnected } = useAppKitAccount()
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'email' | 'account'>('email')

  // Modal states
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [address, isConnected, currentUser, isAuthenticated])

  const fetchProfile = async () => {
    // Check session authentication first
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // Wait for auth to load
    if (authLoading || !currentUser) {
      return
    }

    try {
      setLoading(true)
      // Use username, wallet address, or user ID to fetch profile
      const identifier = currentUser.username || currentUser.walletAddress || currentUser.id
      const response = await fetch(`/api/profile/${identifier}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!profile) return

    setActionLoading(true)
    setActionError('')
    setActionSuccess('')

    try {
      const response = await fetch('/api/account/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profile.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email')
      }

      setActionSuccess(data.message)
    } catch (err: any) {
      setActionError(err.message || 'An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEmailModalSuccess = () => {
    setShowChangeEmailModal(false)
    setActionSuccess('Email updated successfully. Please verify your new email.')
    fetchProfile()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Account Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your account preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('email')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'email'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'account'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Account
          </button>
        </nav>
      </div>

      {/* Success/Error Messages */}
      {(actionSuccess || actionError) && (
        <div className="mb-6">
          {actionSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <p className="text-sm text-green-800 dark:text-green-200">{actionSuccess}</p>
            </div>
          )}
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm text-red-800 dark:text-red-200">{actionError}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content */}
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Email Address
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Your email is used for account recovery and notifications
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <svg
                    className="h-5 w-5 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {profile.email || 'No email address'}
                  </p>
                  {profile.email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {profile.emailVerified ? (
                        <span className="text-green-600 dark:text-green-400">✓ Verified</span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">
                          ⚠ Not verified
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowChangeEmailModal(true)}
                disabled={actionLoading}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {profile.email ? 'Change Email' : 'Add Email'}
              </button>
            </div>

            {profile.email && !profile.emailVerified && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Please verify your email address to ensure you can recover your account.
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={actionLoading}
                  className="mt-2 text-sm font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-50 dark:text-orange-400 dark:hover:text-orange-300"
                >
                  {actionLoading ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Your Account Address
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Your account address is automatically managed
              </p>
            </div>

            {profile.walletAddress ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <svg
                      className="h-5 w-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                      {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Automatically managed
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Your account address was created when you signed in. PXP tokens and tips are
                    sent to this address.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sign in with Google or email to get started
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showChangeEmailModal && profile && (
        <ChangeEmailModal
          userId={profile.id}
          currentEmail={profile.email}
          onClose={() => setShowChangeEmailModal(false)}
          onSuccess={handleEmailModalSuccess}
        />
      )}
    </div>
  )
}
