'use client'

import { ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { celo } from '@reown/appkit/networks'
import { projectId, metadata, wagmiAdapter, celoSepolia } from '@/config/reown'

// Set up queryClient for React Query
const queryClient = new QueryClient()

// Create the AppKit modal instance
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [celoSepolia as any, celo], // Cast custom network for AppKit compatibility
  metadata,
  features: {
    analytics: true, // Enable analytics (optional)
    email: true, // Enable email login
    socials: ['google', 'github', 'apple'], // Enable social logins
    emailShowWallets: true, // Show wallet options in email flow
  },
  themeMode: 'light', // or 'dark' - can be made dynamic later
  themeVariables: {
    '--w3m-accent': '#3b82f6', // Primary blue color (matches your theme)
  },
})

export function ReownProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
