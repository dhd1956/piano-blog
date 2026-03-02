'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

function AuthStatusDebugPage() {
  const { address, isConnected } = useAccount()
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/me')
      const data = await response.json()

      setAuthStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check auth status')
    } finally {
      setLoading(false)
    }
  }

  const checkAuthWithWallet = async () => {
    if (!address) {
      setError('No wallet connected')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/auth/me?wallet=${address}`)
      const data = await response.json()

      setAuthStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check auth status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Authentication Status Debug</h1>

      {/* Wallet Status */}
      <div className="mb-6 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Wallet Connection</h2>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Connected:</span>{' '}
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? 'Yes' : 'No'}
            </span>
          </p>
          {address && (
            <p>
              <span className="font-medium">Address:</span>{' '}
              <code className="text-sm">{address}</code>
            </p>
          )}
        </div>
      </div>

      {/* Auth Status */}
      <div className="mb-6 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Backend Authentication Status</h2>

        {loading && <p className="text-gray-600 dark:text-gray-400">Loading...</p>}

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && authStatus && (
          <div>
            <p className="mb-4">
              <span className="font-medium">Authenticated:</span>{' '}
              <span className={authStatus.success ? 'text-green-600' : 'text-red-600'}>
                {authStatus.success ? 'Yes' : 'No'}
              </span>
            </p>

            {authStatus.success && authStatus.user && (
              <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
                <p>
                  <span className="font-medium">User ID:</span> {authStatus.user.id}
                </p>
                <p>
                  <span className="font-medium">Username:</span> {authStatus.user.username || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Role:</span>{' '}
                  <span className="rounded bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {authStatus.user.role}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Wallet:</span>{' '}
                  <code className="text-sm">{authStatus.user.walletAddress || 'N/A'}</code>
                </p>
              </div>
            )}

            {!authStatus.success && (
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400">{authStatus.message}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  You need to login at{' '}
                  <a href="/auth/login" className="text-blue-600 underline">
                    /auth/login
                  </a>{' '}
                  to access admin pages.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button
          onClick={checkAuthStatus}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Check Auth Status (JWT Token)
        </button>

        <button
          onClick={checkAuthWithWallet}
          disabled={!isConnected}
          className="w-full rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Check Auth Status (with Wallet Address)
        </button>

        <div className="flex gap-4">
          <a
            href="/auth/login"
            className="flex-1 rounded-lg border border-gray-300 px-6 py-3 text-center font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Go to Login
          </a>

          <a
            href="/admin/pxp-config"
            className="flex-1 rounded-lg bg-purple-600 px-6 py-3 text-center font-medium text-white hover:bg-purple-700"
          >
            Try Admin Page
          </a>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-8 rounded-lg border border-yellow-300 bg-yellow-50 p-6 dark:border-yellow-700 dark:bg-yellow-900/20">
        <h3 className="mb-2 font-semibold text-yellow-900 dark:text-yellow-300">
          ℹ️ Understanding Authentication
        </h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-yellow-800 dark:text-yellow-400">
          <li>Wallet connection (Web3) is separate from backend authentication</li>
          <li>Admin pages require JWT token from login OR wallet address in URL</li>
          <li>Login at /auth/login to create a JWT token session</li>
          <li>Blog owner wallet: 0xe8985AEDF83E2a58fEf53B45db2d9556CD5F453A</li>
        </ul>
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(AuthStatusDebugPage), { ssr: false })
