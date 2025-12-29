'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

interface VerificationStatus {
  verified: boolean
  channelId?: string
  channelName?: string
  verifiedAt?: string
  tokenExpiry?: string
  needsReauth?: boolean
}

export default function YouTubeChannelVerification() {
  const { user, isAuthenticated } = useAuth()
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  // Fetch verification status on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchStatus()
    }
  }, [isAuthenticated, user])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/content/youtube/oauth/status', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch verification status')
      }

      const data = await response.json()
      if (data.success) {
        setStatus(data)
      }
    } catch (err) {
      console.error('Error fetching verification status:', err)
      setError('Failed to load verification status')
    } finally {
      setLoading(false)
    }
  }

  const initiateVerification = async () => {
    try {
      setVerifying(true)
      setError('')

      const response = await fetch('/api/content/youtube/oauth/initiate', {
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.errorCode === 'OAUTH_NOT_CONFIGURED') {
          setError('YouTube verification is not configured. Please contact the site administrator.')
        } else {
          throw new Error(data.error || 'Failed to initiate verification')
        }
        return
      }

      const data = await response.json()

      if (data.success && data.authUrl) {
        // Redirect to Google OAuth consent screen
        window.location.href = data.authUrl
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      console.error('Error initiating verification:', err)
      setError(err instanceof Error ? err.message : 'Failed to start verification')
      setVerifying(false)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Checking verification status...
          </p>
        </div>
      </div>
    )
  }

  if (status?.verified && !status.needsReauth) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-800 dark:text-green-200">Channel Verified</h4>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              Your YouTube channel <strong>{status.channelName}</strong> has been verified. You can
              now submit videos and earn PXP rewards.
            </p>
            {status.verifiedAt && (
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                Verified on {new Date(status.verifiedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (status?.needsReauth) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
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
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
              Re-verification Required
            </h4>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Your YouTube authorization has expired. Please re-verify your channel to continue
              earning PXP rewards.
            </p>
            <button
              onClick={initiateVerification}
              disabled={verifying}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  Re-verify Channel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200">
            Verify Your YouTube Channel
          </h4>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            To prevent fraud and ensure you own the videos you submit, you need to verify your
            YouTube channel first.
          </p>

          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              What happens when you verify:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>You'll be redirected to Google to grant permission</li>
              <li>We'll verify you own the YouTube channel</li>
              <li>All your submitted videos will be automatically verified</li>
              <li>You can start earning PXP rewards immediately</li>
            </ul>
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <button
            onClick={initiateVerification}
            disabled={verifying}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifying ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Connecting to YouTube...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                Verify YouTube Channel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
