'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { celo } from 'viem/chains'
import type { ReactNode } from 'react'
import { celoSepolia, wagmiConfig } from './PrivyProvider'

// This module is intentionally excluded from the server bundle (ssr: false in
// the dynamic import in PrivyProvider.tsx). All browser-only Privy/Solana deps
// live here so they never execute in Node.js during static generation.
//
// The WagmiProvider from @privy-io/wagmi wraps wagmi's WagmiProvider with
// PrivyWagmiConnector, which syncs the Privy embedded wallet into wagmi's
// connection state. It uses the shared wagmiConfig so both WagmiProvider
// instances reference the same Zustand store — no state duplication.

export function PrivyProviderClient({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['email', 'google'],
        embeddedWallets: {
          ethereum: { createOnLogin: 'users-without-wallets' },
        },
        defaultChain: celoSepolia,
        supportedChains: [celoSepolia, celo],
        appearance: {
          theme: 'light',
          accentColor: '#6366f1',
          logo: '/static/images/logo.png',
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
    </PrivyProvider>
  )
}
