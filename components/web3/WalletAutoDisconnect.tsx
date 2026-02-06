'use client'

import { useEffect } from 'react'
import { useDisconnect } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { useAuth } from '@/context/AuthContext'

// Session storage key to track if we've already checked on this browser session
const CHECKED_KEY = 'wallet_auto_disconnect_checked'

/**
 * WalletAutoDisconnect Component
 *
 * Prevents SIWE (Sign-In With Ethereum) popup from appearing on initial page load
 * and ensures only Reown embedded wallets are used (not MetaMask/injected wallets).
 *
 * Logic:
 * - Always disconnects injected wallets (MetaMask, etc.) since only embedded wallets are allowed
 * - Only runs the unauthenticated check ONCE per browser session (uses sessionStorage)
 * - If user is NOT logged in on first load -> disconnect wallet to prevent SIWE popup
 * - If user IS logged in -> allow embedded wallet to reconnect normally
 *
 * See: https://github.com/reown-com/appkit/issues/2218
 */
export default function WalletAutoDisconnect() {
  const { disconnect } = useDisconnect()
  const { isAuthenticated, isLoading } = useAuth()
  const { connector } = useAccount()

  // Always disconnect injected wallets (MetaMask, etc.)
  // Only Reown embedded wallets should be used
  useEffect(() => {
    if (!connector) return

    if (connector.type === 'injected') {
      console.log(
        '[WalletAutoDisconnect] Injected wallet detected (e.g. MetaMask), disconnecting — only embedded wallets allowed'
      )
      disconnect()
    }
  }, [connector, disconnect])

  // Disconnect unauthenticated users on initial load to prevent SIWE popup
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
