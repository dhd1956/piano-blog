'use client'

import { useEffect, useRef } from 'react'
import { useDisconnect } from '@reown/appkit/react'
import { useAuth } from '@/context/AuthContext'

/**
 * WalletAutoDisconnect Component
 *
 * Prevents SIWE (Sign-In With Ethereum) popup from appearing on page load.
 * When AppKit tries to reconnect from stored session, it prompts for signature.
 *
 * Logic:
 * - If user is NOT logged in via our auth system -> disconnect wallet to prevent popup
 * - If user IS logged in -> allow wallet to reconnect normally
 *
 * This ensures visitors can browse the blog without wallet popups,
 * while authenticated users maintain their wallet connection.
 *
 * See: https://github.com/reown-com/appkit/issues/2218
 */
export default function WalletAutoDisconnect() {
  const { disconnect } = useDisconnect()
  const { isAuthenticated, isLoading } = useAuth()
  const hasChecked = useRef(false)

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return

    // Only run once
    if (hasChecked.current) return
    hasChecked.current = true

    // If user is not authenticated, disconnect any pending wallet sessions
    // This prevents the SIWE popup from appearing for anonymous visitors
    if (!isAuthenticated) {
      // Small delay to let AppKit initialize and potentially show the modal
      const timer = setTimeout(() => {
        console.log('[WalletAutoDisconnect] User not authenticated, clearing wallet session')
        disconnect()
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isLoading, disconnect])

  return null
}
