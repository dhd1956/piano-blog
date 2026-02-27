'use client'

import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { projectId, metadata, wagmiAdapter, celoSepolia } from '@/config/reown'
import { usePathname } from 'next/navigation'
import WalletAutoDisconnect from '@/components/web3/WalletAutoDisconnect'

// Context to let child components know when AppKit is initialized.
// Components that use Reown hooks (like useAppKit) must wait for this
// to be true before rendering, since createAppKit is loaded asynchronously.
const AppKitReadyContext = createContext(false)
export function useAppKitReady() {
  return useContext(AppKitReadyContext)
}

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

  // Dynamic import — @reown/appkit/react is only loaded when we actually need auth
  const [{ createAppKit }, { celo }] = await Promise.all([
    import('@reown/appkit/react'),
    import('@reown/appkit/networks'),
  ])

  const modal = createAppKit({
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
    enableWalletGuide: false,
    allWallets: 'HIDE',
    themeMode: 'light',
    themeVariables: {
      '--w3m-accent': '#3b82f6',
      '--w3m-font-family': 'var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif',
      '--w3m-border-radius-master': '8px',
    },
    ...(paymasterUrl && { paymasterServiceUrl: paymasterUrl }),
  })

  // Wait for AppKit to fully initialize — this includes fetching remote features
  // and dynamically importing all view components (email OTP, socials, etc.).
  // Without this, the email OTP input won't render because the web components
  // haven't been registered yet when the modal opens.
  await new Promise<void>((resolve) => {
    if (modal.getState().initialized) {
      resolve()
      return
    }
    const unsubscribe = modal.subscribeState((newState: { initialized?: boolean }) => {
      if (newState.initialized) {
        unsubscribe()
        resolve()
      }
    })
  })

  // Hide "Powered by Reown" branding footer (controlled by remote features)
  const { OptionsController } = await import('@reown/appkit-controllers')
  const currentFeatures = OptionsController.state.remoteFeatures || {}
  OptionsController.setRemoteFeatures({ ...currentFeatures, reownBranding: false })
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
        <AppKitReadyContext.Provider value={appKitReady}>
          <WalletAutoDisconnect />
          {appKitReady && OAuthEmailCapture && <OAuthEmailCapture />}
          {children}
        </AppKitReadyContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
