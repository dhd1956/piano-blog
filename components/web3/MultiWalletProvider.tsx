'use client'

import React, { createContext, useContext, ReactNode } from 'react'

export interface MultiWalletProviderProps {
  children: ReactNode
}

export interface MultiWalletContextType {
  // This is a placeholder - in production this would include
  // multiple wallet provider connections (MetaMask, WalletConnect, etc.)
  isMultiWalletSupported: boolean
}

const MultiWalletContext = createContext<MultiWalletContextType>({
  isMultiWalletSupported: false,
})

export function useMultiWallet() {
  return useContext(MultiWalletContext)
}

/**
 * Placeholder MultiWalletProvider component
 * This provides a basic shell for multi-wallet support
 */
export default function MultiWalletProvider({ children }: MultiWalletProviderProps) {
  const contextValue: MultiWalletContextType = {
    isMultiWalletSupported: false,
  }

  return <MultiWalletContext.Provider value={contextValue}>{children}</MultiWalletContext.Provider>
}
