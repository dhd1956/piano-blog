'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider, createConfig } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http } from 'viem'
import { celo } from 'viem/chains'
import type { Chain } from 'viem'
import type { ReactNode } from 'react'

// This module is intentionally excluded from the server bundle via ssr:false
// in the dynamic import in PrivyProvider.tsx. All browser-only Privy, Wagmi,
// WalletConnect, and Solana WASM code lives here and never runs in Node.js.

const celoSepolia: Chain = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/celo_sepolia'] },
  },
  blockExplorers: {
    default: { name: 'CeloScan', url: 'https://celo-sepolia.blockscout.com' },
  },
  testnet: true,
}

// @privy-io/wagmi's createConfig wraps wagmi's createConfig with ssr:true
// and adds PrivyWagmiConnector support (syncs embedded wallet into wagmi).
const wagmiConfig = createConfig({
  chains: [celoSepolia, celo],
  transports: {
    // retryCount: 0 prevents duplicate tx submissions on slow Celo Sepolia RPC
    // (viem's default retry logic causes "already known" sequencer errors)
    [celoSepolia.id]: http('https://rpc.ankr.com/celo_sepolia', { retryCount: 0 }),
    [celo.id]: http(),
  },
})

const queryClient = new QueryClient()

export function PrivyProviderClient({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  // Debug: log the exact value/length so we can verify Vercel compiled it in correctly.
  // Remove this once auth is working.
  console.log('[PrivyProviderClient] appId value:', JSON.stringify(appId), 'length:', appId?.length)

  // If the env var is missing or empty, skip Privy entirely rather than
  // passing an invalid appId that causes Privy to throw asynchronously
  // (bypassing React error boundaries) and crash the page.
  if (!appId) {
    console.error(
      '[PrivyProviderClient] NEXT_PUBLIC_PRIVY_APP_ID is not set — ' +
        'auth will be unavailable. Set the variable in Vercel and redeploy ' +
        'to rebuild the bundle (NEXT_PUBLIC_* vars are compiled at build time).'
    )
    return <>{children}</>
  }

  return (
    <PrivyProvider
      appId={appId}
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
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}
