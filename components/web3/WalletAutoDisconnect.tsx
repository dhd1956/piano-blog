'use client'

import { useEffect } from 'react'
import { useDisconnect } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { useAuth } from '@/context/AuthContext'

/**
 * WalletAutoDisconnect Component
 *
 * Prevents SIWE (Sign-In With Ethereum) popup from appearing for
 * unauthenticated users and ensures only Reown embedded wallets are used.
 *
 * Logic:
 * - Always disconnects injected wallets (MetaMask, etc.)
 * - Whenever auth state resolves to "not authenticated" and a wallet is
 *   connected, disconnect immediately to prevent the SIWE prompt
 * - Authenticated users keep their embedded wallet connection
 *
 * See: https://github.com/reown-com/appkit/issues/2218
 */
export default function WalletAutoDisconnect() {
  const { disconnect } = useDisconnect()
  const { isAuthenticated, isLoading } = useAuth()
  const { connector, isConnected } = useAccount()

  // Always disconnect injected wallets (MetaMask, etc.)
  // Only Reown embedded wallets should be used
  useEffect(() => {
    if (!connector) return

    if (connector.type === 'injected') {
      console.log(
        '[WalletAutoDisconnect] Injected wallet detected, disconnecting — only embedded wallets allowed'
      )
      disconnect()
    }
  }, [connector, disconnect])

  // Disconnect wallet for unauthenticated users to prevent SIWE popup.
  // Runs every time auth state changes — not just once per session —
  // so it catches post-logout state and fresh page loads.
  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated && isConnected) {
      console.log(
        '[WalletAutoDisconnect] User not authenticated but wallet connected, disconnecting to prevent SIWE'
      )
      disconnect()
    }
  }, [isAuthenticated, isLoading, isConnected, disconnect])

  return null
}
