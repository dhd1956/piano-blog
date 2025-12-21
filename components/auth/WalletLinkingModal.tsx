'use client'

/**
 * WalletLinkingModal Component
 *
 * Allows authenticated users to link a wallet to their account
 * for blockchain features (PXP rewards, payments)
 * Only shown when user tries to access wallet-required features
 */

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface WalletLinkingModalProps {
  onClose: () => void
  onSuccess?: () => void
  reason?: string // Why wallet is needed (e.g., "to claim PXP rewards")
}

export default function WalletLinkingModal({
  onClose,
  onSuccess,
  reason = 'for blockchain features',
}: WalletLinkingModalProps) {
  const { user, refreshUser } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  /**
   * Connect MetaMask and get wallet address
   */
  const handleConnectMetaMask = async () => {
    setLoading(true)
    setError('')

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask extension to continue.')
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask and try again.')
      }

      const address = accounts[0]
      setWalletAddress(address)

      // Sign message to prove ownership
      await linkWalletToAccount(address)
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Connection rejected. Please approve the connection request in MetaMask.')
      } else {
        setError(err.message || 'Failed to connect wallet')
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Link wallet to user account via backend API
   */
  const linkWalletToAccount = async (address: string) => {
    try {
      // Check if ethereum provider is available
      if (!window.ethereum) {
        throw new Error('MetaMask or Web3 wallet not detected. Please install MetaMask.')
      }

      // Request signature from user to prove wallet ownership
      const message = `Link wallet to your Piano Blog account: @${user?.username || user?.id}\n\nTimestamp: ${Date.now()}`

      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      })

      // Call backend API to link wallet
      const response = await fetch('/api/auth/link-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)

        // Refresh user data in auth context
        await refreshUser()

        // Close modal after 2 seconds
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 2000)
      } else {
        throw new Error(data.message || data.error || 'Failed to link wallet')
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Signature rejected. Please sign the message to link your wallet.')
      } else {
        setError(err.message || 'Failed to link wallet to account')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Connect Wallet for PXP Rewards
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
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Wallet needed {reason}
                  </p>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    Your account: <strong>@{user?.username || user?.id}</strong>
                  </p>
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    You'll need to sign a message to prove you own the wallet. This is free and
                    doesn't cost gas.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect your wallet to access blockchain features:
              </p>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Claim PXP token rewards</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Send and receive PXP payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Participate in blockchain-based features</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleConnectMetaMask}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.54 0l-9.12 6.18L15.36 2.4 22.54 0zM1.46 0l9.06 6.18L8.58 2.4 1.46 0zm18.06 17.46l-4.08 2.04 3.06 2.88L23.22 23l-.72-5.54zm-17.06 0l4.08 2.04-3.06 2.88L.78 23l.72-5.54z" />
                  </svg>
                  Connect MetaMask
                </>
              )}
            </button>

            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Don't have MetaMask?{' '}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400"
                >
                  Install it here
                </a>
              </p>
            </div>
          </div>
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
              Wallet Connected Successfully!
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You can now claim PXP rewards and use blockchain features.
            </p>
            <p className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-500">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
