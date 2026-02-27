'use client'

import { useEffect } from 'react'
import { useDisconnect } from 'wagmi'
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

  // Disconnect injected wallets for unauthenticated users to prevent SIWE popup.
  // Only targets injected wallets (MetaMask etc.) — Reown embedded wallets are
  // intentionally excluded because OAuthEmailCapture needs the connection to
  // complete OTP verification and create a backend session before auth resolves.
  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated && isConnected && connector?.type === 'injected') {
      console.log(
        '[WalletAutoDisconnect] Unauthenticated injected wallet connected, disconnecting to prevent SIWE'
      )
      disconnect()
    }
  }, [isAuthenticated, isLoading, isConnected, connector, disconnect])

  return null
}
