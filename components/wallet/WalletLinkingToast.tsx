'use client'

import { useEffect, useState } from 'react'
import { useAppKit } from '@reown/appkit/react'

interface WalletLinkingToastProps {
  pxpAmount: number
  onClose?: () => void
  autoHideDuration?: number // milliseconds
}

/**
 * Celebration toast shown when user earns their first PXP.
 * Encourages wallet linking to claim rewards.
 *
 * Usage:
 * ```tsx
 * {showFirstPXPToast && (
 *   <WalletLinkingToast
 *     pxpAmount={50}
 *     onClose={() => setShowFirstPXPToast(false)}
 *   />
 * )}
 * ```
 */
export default function WalletLinkingToast({
  pxpAmount,
  onClose,
  autoHideDuration = 8000, // 8 seconds
}: WalletLinkingToastProps) {
  const { open } = useAppKit()
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)

    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      handleClose()
    }, autoHideDuration)

    return () => {
      clearTimeout(timer)
      clearTimeout(dismissTimer)
    }
  }, [autoHideDuration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      if (onClose) {
        onClose()
      }
    }, 300) // Match animation duration
  }

  const handleLinkWallet = async () => {
    // Open Reown AppKit modal
    await open()
    handleClose()
  }

  return (
    <div
      className={`fixed right-4 bottom-4 z-50 max-w-md transition-all duration-300 ${
        isVisible && !isExiting
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="overflow-hidden rounded-lg border-2 border-green-500 bg-white shadow-2xl dark:border-green-600 dark:bg-gray-800">
        {/* Celebration header with confetti emoji */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 dark:from-green-600 dark:to-emerald-600">
          <div className="flex items-center gap-3">
            <span className="animate-bounce text-3xl">🎉</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">Congratulations!</h3>
              <p className="text-sm text-green-50">You earned your first PXP!</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white transition-colors hover:text-green-100"
              aria-label="Close notification"
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
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          {/* PXP amount */}
          <div className="flex items-center justify-center rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 p-4 dark:from-yellow-900/20 dark:to-amber-900/20">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <svg className="h-8 w-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {pxpAmount}
                </span>
                <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">PXP</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                ≈ ${(pxpAmount * 0.01).toFixed(2)} USD
              </p>
            </div>
          </div>

          {/* Message */}
          <p className="text-center text-sm text-gray-700 dark:text-gray-300">
            Link a wallet to claim your rewards on-chain!
          </p>

          {/* Benefits */}
          <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 flex-shrink-0 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Takes 30 seconds to link</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 flex-shrink-0 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No gas fees required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 flex-shrink-0 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Keep your current account</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleLinkWallet}
            className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-green-600 hover:to-emerald-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none dark:from-green-600 dark:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700"
          >
            Link Wallet Now
          </button>
        </div>
      </div>
    </div>
  )
}
