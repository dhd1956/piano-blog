'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider, createConfig } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http } from 'viem'
import { celo } from 'viem/chains'
import type { Chain } from 'viem'
import type { ReactNode } from 'react'

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

const wagmiConfig = createConfig({
  chains: [celoSepolia, celo],
  transports: {
    [celoSepolia.id]: http('https://rpc.ankr.com/celo_sepolia'),
    [celo.id]: http(),
  },
})

const queryClient = new QueryClient()

export function PrivyAppProvider({ children }: { children: ReactNode }) {
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
