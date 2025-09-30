'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Web3 from 'web3'
import {
  CELO_CHAIN_ID,
  CELO_NETWORK_CONFIG,
  switchToCeloNetwork,
  getCurrentChainId,
  isOnCeloNetwork,
} from '@/utils/contract'
import { VENUE_REGISTRY_ADDRESS, createReadOnlyContract } from '@/utils/contract'

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
export type NetworkStatus = 'unknown' | 'correct' | 'wrong' | 'switching'

export interface Web3State {
  // Wallet connection state
  status: WalletStatus
  walletAddress: string | null
  isConnected: boolean

  // Network state
  chainId: string | null
  networkStatus: NetworkStatus
  isOnCorrectNetwork: boolean

  // Permissions
  isBlogOwner: boolean
  isAuthorizedCurator: boolean

  // Web3 instance
  web3: Web3 | null

  // Error handling
  error: string | null

  // Connection persistence
  hasTriedAutoConnect: boolean
}

export interface Web3Actions {
  // Connection methods
  connect: () => Promise<boolean>
  disconnect: () => void
  switchNetwork: () => Promise<boolean>
  refreshConnection: () => Promise<void>

  // Account switching
  requestAccountChange: () => Promise<boolean>

  // Error handling
  clearError: () => void
}

export interface Web3ContextType extends Web3State, Web3Actions {}

const Web3Context = createContext<Web3ContextType | null>(null)

export function useWeb3(): Web3ContextType {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  // State management
  const [state, setState] = useState<Web3State>({
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
    hasTriedAutoConnect: false,
  })

  // Update state helper
  const updateState = (updates: Partial<Web3State>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  // Clear error
  const clearError = () => {
    updateState({ error: null })
  }

  // Initialize Web3 instance
  const initializeWeb3 = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new Web3(window.ethereum)
    }
    return null
  }

  // Check network status
  const checkNetworkStatus = async (chainId: string): Promise<NetworkStatus> => {
    if (!chainId) return 'unknown'
    return chainId === CELO_CHAIN_ID ? 'correct' : 'wrong'
  }

  // Update permissions with safe error handling
  const updatePermissions = async (address: string) => {
    try {
      // Get Blog Owner address from environment
      const BLOG_OWNER_ADDRESS = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()
      const isBlogOwner = Boolean(
        BLOG_OWNER_ADDRESS && address.toLowerCase() === BLOG_OWNER_ADDRESS
      )

      // In the new simplified contract, only the owner can be a curator
      const isAuthorizedCurator = isBlogOwner

      updateState({ isBlogOwner, isAuthorizedCurator })
    } catch (error) {
      // Silently handle permission errors to prevent JSON-RPC issues
      console.warn('Permission check failed, using defaults:', error.message)
      updateState({ isBlogOwner: false, isAuthorizedCurator: false })
    }
  }

  // Connect wallet
  const connect = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      updateState({
        error: 'MetaMask not found. Please install MetaMask to continue.',
        status: 'error',
      })
      return false
    }

    try {
      updateState({ status: 'connecting', error: null })

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length === 0) {
        updateState({
          error: 'No accounts found. Please unlock MetaMask.',
          status: 'error',
        })
        return false
      }

      const address = accounts[0]
      const web3 = initializeWeb3()
      const chainId = await getCurrentChainId()
      const networkStatus = await checkNetworkStatus(chainId || '')

      updateState({
        status: 'connected',
        walletAddress: address,
        isConnected: true,
        chainId,
        networkStatus,
        isOnCorrectNetwork: networkStatus === 'correct',
        web3,
        error: null,
      })

      // Update permissions in the background
      await updatePermissions(address)

      // Store connection for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('web3_connected', 'true')
        localStorage.setItem('web3_address', address)
      }

      return true
    } catch (error: any) {
      console.error('Error connecting wallet:', error)

      let errorMessage = 'Failed to connect wallet'
      if (error.code === 4001) {
        errorMessage = 'Connection rejected by user'
      } else if (error.message) {
        errorMessage = error.message
      }

      updateState({
        error: errorMessage,
        status: 'error',
      })
      return false
    }
  }

  // Disconnect wallet
  const disconnect = () => {
    updateState({
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
    })

    // Clear persistence
    if (typeof window !== 'undefined') {
      localStorage.removeItem('web3_connected')
      localStorage.removeItem('web3_address')
    }
  }

  // Switch to Celo network
  const switchNetwork = async (): Promise<boolean> => {
    if (!state.isConnected) {
      updateState({ error: 'Wallet not connected' })
      return false
    }

    try {
      updateState({ networkStatus: 'switching' })

      const success = await switchToCeloNetwork()

      if (success) {
        const chainId = await getCurrentChainId()
        const networkStatus = await checkNetworkStatus(chainId || '')

        updateState({
          chainId,
          networkStatus,
          isOnCorrectNetwork: networkStatus === 'correct',
        })

        return true
      } else {
        updateState({
          networkStatus: 'wrong',
          error: 'Failed to switch to Celo Alfajores network',
        })
        return false
      }
    } catch (error: any) {
      console.error('Error switching network:', error)
      updateState({
        networkStatus: 'wrong',
        error: `Network switch failed: ${error.message}`,
      })
      return false
    }
  }

  // Request account change
  const requestAccountChange = async (): Promise<boolean> => {
    if (!window.ethereum) return false

    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      })

      // Refresh connection after permission change
      await refreshConnection()
      return true
    } catch (error) {
      console.error('Error requesting account change:', error)
      return false
    }
  }

  // Refresh connection
  const refreshConnection = async () => {
    if (!window.ethereum) return

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })

      if (accounts.length > 0) {
        const address = accounts[0]
        const chainId = await getCurrentChainId()
        const networkStatus = await checkNetworkStatus(chainId || '')

        updateState({
          walletAddress: address,
          isConnected: true,
          status: 'connected',
          chainId,
          networkStatus,
          isOnCorrectNetwork: networkStatus === 'correct',
          error: null,
        })

        await updatePermissions(address)
      } else {
        disconnect()
      }
    } catch (error) {
      console.error('Error refreshing connection:', error)
    }
  }

  // Auto-connect on mount
  useEffect(() => {
    const autoConnect = async () => {
      if (state.hasTriedAutoConnect) return

      updateState({ hasTriedAutoConnect: true })

      // Check if user was previously connected
      const wasConnected =
        typeof window !== 'undefined' && localStorage.getItem('web3_connected') === 'true'

      if (wasConnected && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            await connect()
          } else {
            // Clear stale localStorage
            localStorage.removeItem('web3_connected')
            localStorage.removeItem('web3_address')
          }
        } catch (error) {
          console.error('Auto-connect failed:', error)
        }
      }
    }

    autoConnect()
  }, [state.hasTriedAutoConnect])

  // Listen for account and network changes
  useEffect(() => {
    if (!window.ethereum || !state.isConnected) return

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else if (accounts[0] !== state.walletAddress) {
        const address = accounts[0]
        updateState({ walletAddress: address })
        await updatePermissions(address)
      }
    }

    const handleChainChanged = async (chainId: string) => {
      const networkStatus = await checkNetworkStatus(chainId)
      updateState({
        chainId,
        networkStatus,
        isOnCorrectNetwork: networkStatus === 'correct',
      })
    }

    const handleDisconnect = () => {
      disconnect()
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
    window.ethereum.on('disconnect', handleDisconnect)

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
        window.ethereum.removeListener('disconnect', handleDisconnect)
      }
    }
  }, [state.isConnected, state.walletAddress])

  // Context value
  const contextValue: Web3ContextType = {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    refreshConnection,
    requestAccountChange,
    clearError,
  }

  return <Web3Context.Provider value={contextValue}>{children}</Web3Context.Provider>
}

// Convenience hook for wallet connection status
export function useWalletConnection() {
  const { status, isConnected, walletAddress, error } = useWeb3()

  return {
    status,
    isConnected,
    walletAddress,
    error,
    isLoading: status === 'connecting',
  }
}

// Convenience hook for network status
export function useNetwork() {
  const { chainId, networkStatus, isOnCorrectNetwork, switchNetwork } = useWeb3()

  return {
    chainId,
    networkStatus,
    isOnCorrectNetwork,
    switchNetwork,
    isCorrectNetwork: isOnCorrectNetwork,
    needsNetworkSwitch: networkStatus === 'wrong',
  }
}

// Convenience hook for permissions
export function usePermissions() {
  const { isBlogOwner, isAuthorizedCurator, walletAddress } = useWeb3()

  return {
    isBlogOwner,
    isAuthorizedCurator,
    walletAddress,
    hasAnyPermissions: isBlogOwner || isAuthorizedCurator,
    canAccessCurator: isBlogOwner || isAuthorizedCurator,
  }
}
