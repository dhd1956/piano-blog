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

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
export type NetworkStatus = 'unknown' | 'correct' | 'wrong' | 'switching'

export interface Web3State {
  status: WalletStatus
  walletAddress: string | null
  isConnected: boolean
  chainId: string | null
  networkStatus: NetworkStatus
  isOnCorrectNetwork: boolean
  isBlogOwner: boolean
  isAuthorizedCurator: boolean
  web3: Web3 | null
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

interface Web3ProviderProps {
  children: ReactNode
}

export function SafeWeb3Provider({ children }: Web3ProviderProps) {
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

  const updateState = (updates: Partial<Web3State>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  // Safe Web3 instance creation
  const createWeb3Instance = (): Web3 | null => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        return new Web3(window.ethereum)
      }
    } catch (error) {
      console.warn('Failed to create Web3 instance:', error)
    }
    return null
  }

  // Safe permission check (no contract calls)
  const updatePermissions = (address: string) => {
    try {
      const BLOG_OWNER_ADDRESS = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()
      const isBlogOwner = Boolean(
        BLOG_OWNER_ADDRESS && address.toLowerCase() === BLOG_OWNER_ADDRESS
      )
      const isAuthorizedCurator = isBlogOwner // Only owner can be curator in new contract

      updateState({ isBlogOwner, isAuthorizedCurator })
    } catch (error) {
      console.warn('Permission check failed:', error)
      updateState({ isBlogOwner: false, isAuthorizedCurator: false })
    }
  }

  // Connect wallet
  const connect = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      updateState({ error: 'MetaMask not found' })
      return false
    }

    try {
      updateState({ status: 'connecting', error: null })

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts || accounts.length === 0) {
        updateState({ status: 'disconnected', error: 'No accounts found' })
        return false
      }

      const address = accounts[0]
      const chainId = await getCurrentChainId()
      const web3 = createWeb3Instance()
      const networkStatus = chainId === CELO_CHAIN_ID ? 'correct' : 'wrong'

      updateState({
        status: 'connected',
        isConnected: true,
        walletAddress: address,
        chainId,
        networkStatus,
        isOnCorrectNetwork: networkStatus === 'correct',
        web3,
        error: null,
      })

      updatePermissions(address)
      return true
    } catch (error: any) {
      console.error('Connection failed:', error)
      updateState({
        status: 'error',
        isConnected: false,
        error: error.message || 'Connection failed',
      })
      return false
    }
  }

  // Disconnect wallet
  const disconnect = () => {
    updateState({
      status: 'disconnected',
      isConnected: false,
      walletAddress: null,
      chainId: null,
      networkStatus: 'unknown',
      isOnCorrectNetwork: false,
      isBlogOwner: false,
      isAuthorizedCurator: false,
      web3: null,
      error: null,
    })
  }

  // Switch network
  const switchNetwork = async (): Promise<boolean> => {
    try {
      updateState({ networkStatus: 'switching' })
      const success = await switchToCeloNetwork()

      if (success) {
        const chainId = await getCurrentChainId()
        updateState({
          chainId,
          networkStatus: 'correct',
          isOnCorrectNetwork: true,
        })
      } else {
        updateState({ networkStatus: 'wrong' })
      }

      return success
    } catch (error) {
      console.error('Network switch failed:', error)
      updateState({ networkStatus: 'wrong' })
      return false
    }
  }

  // Refresh connection
  const refreshConnection = async () => {
    if (state.isConnected && state.walletAddress) {
      const chainId = await getCurrentChainId()
      const networkStatus = chainId === CELO_CHAIN_ID ? 'correct' : 'wrong'

      updateState({
        chainId,
        networkStatus,
        isOnCorrectNetwork: networkStatus === 'correct',
      })
    }
  }

  // Request account change
  const requestAccountChange = async (): Promise<boolean> => {
    try {
      await window.ethereum?.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      })
      return await connect()
    } catch (error) {
      console.error('Account change failed:', error)
      return false
    }
  }

  // Clear error
  const clearError = () => {
    updateState({ error: null })
  }

  // Handle account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else if (accounts[0] !== state.walletAddress) {
        updateState({ walletAddress: accounts[0] })
        updatePermissions(accounts[0])
      }
    }

    const handleChainChanged = (chainId: string) => {
      updateState({
        chainId,
        networkStatus: chainId === CELO_CHAIN_ID ? 'correct' : 'wrong',
        isOnCorrectNetwork: chainId === CELO_CHAIN_ID,
      })
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum?.removeListener('chainChanged', handleChainChanged)
    }
  }, [state.walletAddress])

  // Auto-connect on mount
  useEffect(() => {
    if (state.hasTriedAutoConnect) return

    const autoConnect = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          })

          if (accounts && accounts.length > 0) {
            await connect()
          }
        } catch (error) {
          console.warn('Auto-connect failed:', error)
        }
      }

      updateState({ hasTriedAutoConnect: true })
    }

    autoConnect()
  }, [])

  const contextValue = {
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

export function useWeb3() {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a SafeWeb3Provider')
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
    isLoading: status === 'connecting',
  }
}

export function useNetwork() {
  const { isOnCorrectNetwork, networkStatus } = useWeb3()
  return {
    isOnCorrectNetwork,
    needsNetworkSwitch: networkStatus === 'wrong',
  }
}

export function usePermissions() {
  const { isBlogOwner, isAuthorizedCurator } = useWeb3()
  return {
    isBlogOwner,
    isAuthorizedCurator,
    hasAnyPermissions: isBlogOwner || isAuthorizedCurator,
  }
}
