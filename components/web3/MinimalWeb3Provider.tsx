'use client'

import React, { createContext, useContext, ReactNode } from 'react'

// Minimal Web3 provider that makes ZERO RPC calls during initialization
export interface Web3State {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  walletAddress: string | null
  isConnected: boolean
  chainId: string | null
  networkStatus: 'unknown' | 'correct' | 'wrong' | 'switching'
  isOnCorrectNetwork: boolean
  isBlogOwner: boolean
  isAuthorizedCurator: boolean
  web3: any | null
  error: string | null
  hasTriedAutoConnect: boolean
}

export interface Web3Actions {
  connect: () => Promise<boolean>
  disconnect: () => void
  switchNetwork: () => Promise<boolean>
  refreshConnection: () => Promise<void>
  requestAccountChange: () => Promise<boolean>
  clearError: () => void
}

const Web3Context = createContext<(Web3State & Web3Actions) | undefined>(undefined)

export function MinimalWeb3Provider({ children }: { children: ReactNode }) {
  // Static state - no async operations during initialization
  const staticState: Web3State = {
    status: 'disconnected',
    walletAddress: null,
    isConnected: false,
    chainId: null,
    networkStatus: 'unknown',
    isOnCorrectNetwork: false,
    isBlogOwner: false,
    isAuthorizedCurator: false,
    web3: null,
    error: null,
    hasTriedAutoConnect: false
  }

  // Actions that won't cause RPC errors during render
  const actions: Web3Actions = {
    connect: async () => {
      console.log('Connect called - implement when needed')
      return false
    },
    disconnect: () => {
      console.log('Disconnect called')
    },
    switchNetwork: async () => {
      console.log('Switch network called')
      return false
    },
    refreshConnection: async () => {
      console.log('Refresh connection called')
    },
    requestAccountChange: async () => {
      console.log('Request account change called')
      return false
    },
    clearError: () => {
      console.log('Clear error called')
    }
  }

  const contextValue = {
    ...staticState,
    ...actions
  }

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a MinimalWeb3Provider')
  }
  return context
}

// Additional hooks for compatibility
export function useWalletConnection() {
  const { status, isConnected, walletAddress, error } = useWeb3()
  return {
    status,
    isConnected,
    walletAddress,
    error,
    isLoading: status === 'connecting'
  }
}

export function useNetwork() {
  const { isOnCorrectNetwork, networkStatus } = useWeb3()
  return {
    isOnCorrectNetwork,
    needsNetworkSwitch: networkStatus === 'wrong'
  }
}

export function usePermissions() {
  const { isBlogOwner, isAuthorizedCurator } = useWeb3()
  return {
    isBlogOwner,
    isAuthorizedCurator,
    hasAnyPermissions: isBlogOwner || isAuthorizedCurator
  }
}