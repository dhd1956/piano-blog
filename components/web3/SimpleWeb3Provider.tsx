'use client'

import React, { ReactNode } from 'react'

// Minimal Web3 provider for testing
export function SimpleWeb3Provider({ children }: { children: ReactNode }) {
  return (
    <div>
      {children}
    </div>
  )
}

// Export all hooks for compatibility
export function useWeb3() {
  return {
    status: 'connected' as const,
    isConnected: true,
    walletAddress: '0xe8985aedf83e2a58fef53b45db2d9556cd5f453a',
    chainId: '0xaef3',
    networkStatus: 'correct' as const,
    isOnCorrectNetwork: true,
    error: null,
    isBlogOwner: true,
    isAuthorizedCurator: true,
    web3: { eth: {} } as any, // Mock Web3 object
    hasTriedAutoConnect: true,
    connect: async () => true,
    disconnect: () => {},
    switchNetwork: async () => true,
    refreshConnection: async () => {},
    requestAccountChange: async () => true,
    clearError: () => {}
  }
}

export function useWalletConnection() {
  return {
    status: 'connected' as const,
    isConnected: true,
    walletAddress: '0xe8985aedf83e2a58fef53b45db2d9556cd5f453a',
    error: null,
    isLoading: false
  }
}

export function useNetwork() {
  return {
    isOnCorrectNetwork: true,
    needsNetworkSwitch: false
  }
}

export function usePermissions() {
  return {
    isBlogOwner: true,
    isAuthorizedCurator: true,
    hasAnyPermissions: true
  }
}