'use client'

import { ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { celo } from '@reown/appkit/networks'
import { projectId, metadata, wagmiAdapter, celoSepolia } from '@/config/reown'

// Set up queryClient for React Query
const queryClient = new QueryClient()

// Get paymaster URL from environment
const paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL || ''

// Log gas sponsorship status for development
if (typeof window !== 'undefined') {
  if (paymasterUrl) {
    console.log(
      '%c⚡ Gas Sponsorship: ENABLED',
      'color: #10b981; font-weight: bold; font-size: 14px;',
      '\n💰 Transactions will be sponsored by the platform',
      '\n📊 Monitor costs at: https://dashboard.pimlico.io'
    )
  } else {
    console.log(
      '%c⚠️  Gas Sponsorship: DISABLED',
      'color: #f59e0b; font-weight: bold; font-size: 14px;',
      '\n💳 Users will pay their own gas fees',
      '\n📖 To enable: See docs/GAS_SPONSORSHIP_ACTIVATION.md'
    )
  }
}

// Prevent SIWE popup for unauthenticated users.
// wagmi persists wallet state in cookies (cookieStorage). On page load it
// auto-reconnects before any React component can call disconnect(), which
// triggers the "Sign this message" SIWE prompt. Clearing the persisted state
// synchronously here — before createAppKit reads it — prevents that.
if (typeof window !== 'undefined') {
  const hasAuthToken = document.cookie.includes('auth_token=')
  if (!hasAuthToken) {
    // Clear wagmi/Reown cookies
    document.cookie.split(';').forEach((c) => {
      const key = c.trim().split('=')[0]
      if (
        key.startsWith('wagmi') ||
        key.startsWith('wc@') ||
        key.startsWith('@w3m') ||
        key.startsWith('W3M') ||
        key.startsWith('@appkit')
      ) {
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      }
    })
    // Clear wagmi/Reown localStorage
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith('wagmi') ||
          key.startsWith('wc@') ||
          key.startsWith('@w3m') ||
          key.startsWith('W3M') ||
          key.startsWith('-walletlink') ||
          key.startsWith('@appkit'))
      ) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  }
}

// Create the AppKit modal instance
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [celoSepolia as any, celo], // Cast custom network for AppKit compatibility
  metadata,
  features: {
    analytics: true, // Enable analytics (optional)
    email: true, // Enable email login
    socials: ['google'], // OAuth providers for embedded wallet
    emailShowWallets: false, // Hide wallet options in email flow
    onramp: !paymasterUrl, // Disable onramp when gas is sponsored
  },
  // Disable external wallet connections - embedded wallets only
  enableWallets: false, // Disable injected wallets (MetaMask, etc.)
  enableWalletConnect: false, // Disable WalletConnect QR
  allWallets: 'HIDE', // Hide "All Wallets" section
  themeMode: 'light', // or 'dark' - can be made dynamic later
  themeVariables: {
    '--w3m-accent': '#3b82f6', // Primary blue color (matches your theme)
  },
  // Add paymaster service URL for gas sponsorship
  // When set, transactions will be sponsored by the platform
  ...(paymasterUrl && { paymasterServiceUrl: paymasterUrl }),
})

export function ReownProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
