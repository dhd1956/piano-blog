'use client'

import { ReactNode, useEffect } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { celo } from '@reown/appkit/networks'
import { projectId, metadata, wagmiAdapter, celoSepolia } from '@/config/reown'
import { usePathname } from 'next/navigation'
import OAuthEmailCapture from '@/components/OAuthEmailCapture'
import WalletAutoDisconnect from '@/components/web3/WalletAutoDisconnect'

// Set up queryClient for React Query
const queryClient = new QueryClient()

// Get paymaster URL from environment
const paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL || ''

// Lazy AppKit initialization — only called when Reown is actually needed.
// wagmi (WagmiProvider) is always rendered because it's just a state layer with
// no UI. The SIWE "sign this message" popup comes from Reown's createAppKit, so
// deferring that call until the user needs auth prevents the popup on public pages.
let appKitInitialized = false
function ensureAppKit() {
  if (appKitInitialized) return
  appKitInitialized = true

  // Clear stale Reown localStorage before init for unauthenticated users
  if (typeof window !== 'undefined' && !document.cookie.includes('auth_active=')) {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith('@w3m') ||
          key.startsWith('W3M') ||
          key.startsWith('@appkit') ||
          key.startsWith('wc@'))
      ) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  }

  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [celoSepolia as any, celo],
    metadata,
    features: {
      analytics: true,
      email: true,
      socials: ['google'],
      emailShowWallets: false,
      onramp: !paymasterUrl,
    },
    enableWallets: false,
    enableWalletConnect: false,
    allWallets: 'HIDE',
    themeMode: 'light',
    themeVariables: {
      '--w3m-accent': '#3b82f6',
    },
    ...(paymasterUrl && { paymasterServiceUrl: paymasterUrl }),
  })
}

export function ReownProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Initialize AppKit only when actually needed:
  // - On auth pages (user is logging in)
  // - When user is authenticated (has active session)
  useEffect(() => {
    const isAuthenticated = document.cookie.includes('auth_active=')
    const isAuthPage = pathname?.startsWith('/auth/') ?? false

    if (isAuthenticated || isAuthPage) {
      ensureAppKit()
    }
  }, [pathname])

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletAutoDisconnect />
        <OAuthEmailCapture />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
