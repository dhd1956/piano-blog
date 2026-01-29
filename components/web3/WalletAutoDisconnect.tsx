'use client'

import { useEffect } from 'react'
import { useDisconnect } from '@reown/appkit/react'
import { useAuth } from '@/context/AuthContext'

// Session storage key to track if we've already checked on this browser session
const CHECKED_KEY = 'wallet_auto_disconnect_checked'

/**
 * WalletAutoDisconnect Component
 *
 * Prevents SIWE (Sign-In With Ethereum) popup from appearing on initial page load.
 * When AppKit tries to reconnect from stored session, it prompts for signature.
 *
 * Logic:
 * - Only runs ONCE per browser session (uses sessionStorage)
 * - If user is NOT logged in on first load -> disconnect wallet to prevent popup
 * - If user IS logged in -> allow wallet to reconnect normally
 * - Subsequent page navigations do NOT trigger disconnect
 *
 * This ensures visitors can browse the blog without wallet popups,
 * while authenticated users maintain their wallet connection.
 *
 * See: https://github.com/reown-com/appkit/issues/2218
 */
export default function WalletAutoDisconnect() {
  const { disconnect } = useDisconnect()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return

    // Only run once per browser session (survives page navigations)
    if (typeof window !== 'undefined' && sessionStorage.getItem(CHECKED_KEY)) {
      return
    }

    // Mark as checked for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(CHECKED_KEY, 'true')
    }

    // If user is not authenticated on initial load, disconnect any pending wallet sessions
    // This prevents the SIWE popup from appearing for anonymous visitors
    if (!isAuthenticated) {
      // Small delay to let AppKit initialize and potentially show the modal
      const timer = setTimeout(() => {
        console.log(
          '[WalletAutoDisconnect] User not authenticated on initial load, clearing wallet session'
        )
        disconnect()
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isLoading, disconnect])

  return null
}
