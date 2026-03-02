'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider, createConfig } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http } from 'viem'
import { celo } from 'viem/chains'
import type { Chain } from 'viem'
import { useState, useEffect, type ReactNode } from 'react'

// Celo Sepolia testnet chain definition
export const celoSepolia: Chain = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/celo_sepolia'],
    },
  },
  blockExplorers: {
    default: { name: 'CeloScan', url: 'https://celo-sepolia.blockscout.com' },
  },
  testnet: true,
}

export const wagmiConfig = createConfig({
  chains: [celoSepolia, celo],
  transports: {
    [celoSepolia.id]: http('https://rpc.ankr.com/celo_sepolia'),
    [celo.id]: http(),
  },
})

const queryClient = new QueryClient()

export function PrivyAppProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // During SSR / static generation, render children without the Privy/Wagmi
  // wrappers. They access browser globals and will break Next.js static builds.
  if (!mounted) return <>{children}</>

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
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}
