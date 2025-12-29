'use client'

import { useEffect, useState } from 'react'
import WalletLinkingPromptCard from './WalletLinkingPromptCard'

interface WalletLinkingDashboardSectionProps {
  hasWallet: boolean
  pxpBalance: number
}

/**
 * Client wrapper for WalletLinkingPromptCard on the dashboard.
 * Checks if the prompt should be shown and handles dismissal.
 */
export default function WalletLinkingDashboardSection({
  hasWallet,
  pxpBalance,
}: WalletLinkingDashboardSectionProps) {
  const [shouldShow, setShouldShow] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkShouldShow() {
      if (hasWallet || pxpBalance <= 0) {
        setIsLoading(false)
        setShouldShow(false)
        return
      }

      try {
        const response = await fetch('/api/profile/dismiss-wallet-prompt')
        if (!response.ok) {
          // If API fails, show the prompt anyway (better to show than hide)
          setShouldShow(true)
          setIsLoading(false)
          return
        }

        const data = await response.json()
        setShouldShow(data.shouldShow)
      } catch (error) {
        console.error('Error checking wallet prompt status:', error)
        // Show prompt on error
        setShouldShow(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkShouldShow()
  }, [hasWallet, pxpBalance])

  const handleDismiss = () => {
    setShouldShow(false)
  }

  if (isLoading || !shouldShow) {
    return null
  }

  return (
    <div className="mb-6">
      <WalletLinkingPromptCard pxpBalance={pxpBalance} onDismiss={handleDismiss} />
    </div>
  )
}
