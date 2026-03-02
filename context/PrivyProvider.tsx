'use client'

import { WagmiProvider, createConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http } from 'viem'
import { celo } from 'viem/chains'
import type { Chain } from 'viem'
import dynamic from 'next/dynamic'
import { useState, useEffect, type ReactNode } from 'react'

export const celoSepolia: Chain = {
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

// Shared by both the SSR WagmiProvider and the client-side @privy-io/wagmi
// WagmiProvider so they reference the same Zustand store.
export const wagmiConfig = createConfig({
  chains: [celoSepolia, celo],
  transports: {
    [celoSepolia.id]: http('https://rpc.ankr.com/celo_sepolia'),
    [celo.id]: http(),
  },
  ssr: true,
})

const queryClient = new QueryClient()

// PrivyProviderClient is excluded from the server bundle so that
// @privy-io/react-auth (WalletConnect, Solana WASM, etc.) never runs in Node.js.
// The outer WagmiProvider below renders during SSR so wagmi hooks work on
// every statically-generated page without a provider-missing error.
const PrivyContextLayer = dynamic(
  () => import('./PrivyProviderClient').then((m) => ({ default: m.PrivyProviderClient })),
  { ssr: false }
)

export function PrivyAppProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        {mounted ? <PrivyContextLayer>{children}</PrivyContextLayer> : children}
      </WagmiProvider>
    </QueryClientProvider>
  )
}
