'use client'

import { ReactNode, useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { projectId, metadata, wagmiAdapter, celoSepolia } from '@/config/reown'
import { usePathname } from 'next/navigation'
import WalletAutoDisconnect from '@/components/web3/WalletAutoDisconnect'

// Set up queryClient for React Query
const queryClient = new QueryClient()

// Get paymaster URL from environment
const paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL || ''

// Lazy AppKit initialization — only called when Reown is actually needed.
// CRITICAL: We dynamically import @reown/appkit/react so the module never loads
// on public pages. Merely importing the module (even without calling createAppKit)
// registers web components and controllers that can trigger the SIWE popup.
// wagmi (WagmiProvider) is always rendered because it's just a state layer with no UI.
let appKitInitialized = false
async function ensureAppKit() {
  if (appKitInitialized) return
  appKitInitialized = true

  // Always clear stale Reown localStorage before init.
  // The JWT session (auth_token) is our source of truth for authentication,
  // NOT the Reown wallet session. If Reown finds stale session state, it
  // tries to re-verify via SIWE ("sign this message"), causing an unwanted popup.
  // Clearing before init forces Reown to start fresh every time.
  if (typeof window !== 'undefined') {
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

  // Dynamic import — @reown/appkit/react is only loaded when we actually need auth
  const [{ createAppKit }, { celo }] = await Promise.all([
    import('@reown/appkit/react'),
    import('@reown/appkit/networks'),
  ])

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

// OAuthEmailCapture uses useAppKitAccount (Reown-specific, no wagmi equivalent).
// We lazy-load it so @reown/appkit/react is never imported on public pages.
let OAuthEmailCapture: React.ComponentType | null = null

export function ReownProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [appKitReady, setAppKitReady] = useState(false)

  // Initialize AppKit only when actually needed:
  // - On auth pages (user is logging in)
  // - When user is authenticated (has active session)
  useEffect(() => {
    const isAuthenticated = document.cookie.includes('auth_active=')
    const isAuthPage = pathname?.startsWith('/auth/') ?? false

    if (isAuthenticated || isAuthPage) {
      ensureAppKit().then(async () => {
        // Lazy-load OAuthEmailCapture only after AppKit is initialized
        if (!OAuthEmailCapture) {
          const mod = await import('@/components/OAuthEmailCapture')
          OAuthEmailCapture = mod.default
        }
        setAppKitReady(true)
      })
    }
  }, [pathname])

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <WalletAutoDisconnect />
        {appKitReady && OAuthEmailCapture && <OAuthEmailCapture />}
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
