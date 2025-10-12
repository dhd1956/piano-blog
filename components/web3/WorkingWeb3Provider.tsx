'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Web3 from 'web3'

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

const CELO_CHAIN_ID = '0xaef3' // 44787 in hex
const CELO_NETWORK_CONFIG = {
  chainId: CELO_CHAIN_ID,
  chainName: 'Celo Alfajores Testnet',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
  blockExplorerUrls: ['https://alfajores.celoscan.io/'],
}

export function WorkingWeb3Provider({ children }: { children: ReactNode }) {
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

  // Safe helper functions with try/catch
  const safeCall = async (fn: () => Promise<any>, fallback: any = null) => {
    try {
      return await fn()
    } catch (error) {
      console.warn('Safe call failed:', error)
      return fallback
    }
  }

  const updatePermissions = async (address: string) => {
    try {
      // First, check blog owner locally
      const BLOG_OWNER_ADDRESS = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()
      const isBlogOwner = Boolean(
        BLOG_OWNER_ADDRESS && address.toLowerCase() === BLOG_OWNER_ADDRESS
      )

      // Then check database for curator status
      const response = await fetch(`/api/auth/permissions?address=${encodeURIComponent(address)}`)

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.permissions) {
          updateState({
            isBlogOwner: data.permissions.isBlogOwner,
            isAuthorizedCurator: data.permissions.isAuthorizedCurator,
          })
          return
        }
      }

      // Fallback to local check only if API fails
      updateState({ isBlogOwner, isAuthorizedCurator: isBlogOwner })
    } catch (error) {
      console.warn('Permission update failed:', error)
      // Fallback to local blog owner check
      const BLOG_OWNER_ADDRESS = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()
      const isBlogOwner = Boolean(
        BLOG_OWNER_ADDRESS && address.toLowerCase() === BLOG_OWNER_ADDRESS
      )
      updateState({ isBlogOwner, isAuthorizedCurator: isBlogOwner })
    }
  }

  const connect = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      updateState({ error: 'MetaMask not found' })
      return false
    }

    try {
      updateState({ status: 'connecting', error: null })

      const accounts = await safeCall(
        () => window.ethereum.request({ method: 'eth_requestAccounts' }),
        []
      )

      if (!accounts || accounts.length === 0) {
        updateState({ status: 'disconnected', error: 'No accounts found' })
        return false
      }

      const address = accounts[0]
      const chainId = await safeCall(() => window.ethereum.request({ method: 'eth_chainId' }), null)

      console.log('🔧 Creating Web3 instance with window.ethereum:', !!window.ethereum)
      console.log('🔧 MetaMask detected:', !!window.ethereum?.isMetaMask)

      const web3 = new Web3(window.ethereum)
      console.log('🔧 Web3 instance created:', !!web3)
      console.log('🔧 Web3 provider:', web3.currentProvider)

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

      await updatePermissions(address)
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

  const switchNetwork = async (): Promise<boolean> => {
    if (!window.ethereum) return false

    try {
      updateState({ networkStatus: 'switching' })

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CELO_CHAIN_ID }],
      })

      updateState({
        chainId: CELO_CHAIN_ID,
        networkStatus: 'correct',
        isOnCorrectNetwork: true,
      })

      return true
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CELO_NETWORK_CONFIG],
          })

          updateState({
            chainId: CELO_CHAIN_ID,
            networkStatus: 'correct',
            isOnCorrectNetwork: true,
          })

          return true
        } catch (addError) {
          console.error('Failed to add network:', addError)
        }
      }

      updateState({ networkStatus: 'wrong' })
      return false
    }
  }

  const refreshConnection = async () => {
    if (state.isConnected && state.walletAddress) {
      const chainId = await safeCall(
        () => window.ethereum.request({ method: 'eth_chainId' }),
        state.chainId
      )

      const networkStatus = chainId === CELO_CHAIN_ID ? 'correct' : 'wrong'
      updateState({
        chainId,
        networkStatus,
        isOnCorrectNetwork: networkStatus === 'correct',
      })
    }
  }

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

  const clearError = () => {
    updateState({ error: null })
  }

  // Event listeners with safe calls
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return

    const handleAccountsChanged = async (accounts: string[]) => {
      try {
        if (accounts.length === 0) {
          disconnect()
        } else if (accounts[0] !== state.walletAddress) {
          updateState({ walletAddress: accounts[0] })
          await updatePermissions(accounts[0])
        }
      } catch (error) {
        console.warn('Account change handler failed:', error)
      }
    }

    const handleChainChanged = (chainId: string) => {
      try {
        updateState({
          chainId,
          networkStatus: chainId === CELO_CHAIN_ID ? 'correct' : 'wrong',
          isOnCorrectNetwork: chainId === CELO_CHAIN_ID,
        })
      } catch (error) {
        console.warn('Chain change handler failed:', error)
      }
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      try {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum?.removeListener('chainChanged', handleChainChanged)
      } catch (error) {
        console.warn('Failed to remove event listeners:', error)
      }
    }
  }, [state.walletAddress])

  // Safe auto-connect
  useEffect(() => {
    if (state.hasTriedAutoConnect) return

    const autoConnect = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          const accounts = await safeCall(
            () => window.ethereum.request({ method: 'eth_accounts' }),
            []
          )

          if (accounts && accounts.length > 0) {
            await connect()
          }
        }
      } catch (error) {
        console.warn('Auto-connect failed:', error)
      } finally {
        updateState({ hasTriedAutoConnect: true })
      }
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
    throw new Error('useWeb3 must be used within a WorkingWeb3Provider')
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
    canAccessCurator: isBlogOwner || isAuthorizedCurator,
  }
}
