'use client'

import { useState } from 'react'
import { useAppKit } from '@reown/appkit/react'
import { useAuth } from '@/context/AuthContext'

interface WalletLinkingPromptCardProps {
  pxpBalance: number
  onDismiss?: () => void
}

export default function WalletLinkingPromptCard({
  pxpBalance,
  onDismiss,
}: WalletLinkingPromptCardProps) {
  const { open } = useAppKit()
  const { user } = useAuth()
  const [isDismissing, setIsDismissing] = useState(false)

  // Don't show if user already has a wallet
  if (user?.walletAddress) {
    return null
  }

  // Don't show if no PXP earned yet
  if (pxpBalance <= 0) {
    return null
  }

  const handleLinkWallet = async () => {
    // Set intent flag so OAuthEmailCapture takes the linking path
    sessionStorage.setItem('wallet_linking_intent', 'true')
    await open()
  }

  const handleDismiss = async () => {
    setIsDismissing(true)

    try {
      // Call API to record dismissal
      const response = await fetch('/api/profile/dismiss-wallet-prompt', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to dismiss prompt')
      }

      // Notify parent component
      if (onDismiss) {
        onDismiss()
      }
    } catch (error) {
      console.error('Error dismissing wallet prompt:', error)
      setIsDismissing(false)
    }
  }

  // Format PXP balance with commas
  const formattedBalance = pxpBalance.toLocaleString()
  // Calculate USD value (1 PXP = $0.01)
  const usdValue = (pxpBalance * 0.01).toFixed(2)

  return (
    <div className="border-primary-500 from-primary-50 dark:from-primary-900/20 dark:border-primary-600 relative overflow-hidden rounded-lg border-2 bg-gradient-to-br to-blue-50 p-6 shadow-lg dark:to-blue-900/20">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        disabled={isDismissing}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50 dark:text-gray-500 dark:hover:text-gray-300"
        aria-label="Dismiss wallet linking prompt"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Content */}
      <div className="space-y-4">
        {/* Header with icon */}
        <div className="flex items-start gap-3">
          <div className="bg-primary-100 dark:bg-primary-800/50 flex-shrink-0 rounded-full p-3">
            <svg
              className="text-primary-600 dark:text-primary-400 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              You Have {formattedBalance} PXP Waiting!
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Worth approximately ${usdValue} USD
            </p>
          </div>
        </div>

        {/* Body text */}
        <div className="space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Link a wallet to claim your PXP rewards and unlock the full Global Piano Network
            experience.
          </p>

          {/* Benefits list */}
          <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Claim your earned PXP tokens on-chain</span>
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No gas fees - transactions are sponsored</span>
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Keep your existing account - just add a wallet</span>
            </li>
          </ul>
        </div>

        {/* CTA button */}
        <button
          onClick={handleLinkWallet}
          className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
        >
          Link Wallet to Claim {formattedBalance} PXP
        </button>

        {/* Optional: Remind me later text */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-500">
          Dismiss to hide for 30 days
        </p>
      </div>
    </div>
  )
}
