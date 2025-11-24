import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo } from '@reown/appkit/networks'
import { http } from 'wagmi'
import type { Chain } from 'wagmi/chains'

// Get project ID from environment
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || ''

if (!projectId || projectId.includes('placeholder')) {
  console.warn(
    '⚠️ NEXT_PUBLIC_REOWN_PROJECT_ID is not set or using placeholder value.\n' +
      'Get a real Project ID from https://cloud.reown.com/ for wallet connection features to work.\n' +
      'WalletConnect features will be disabled.'
  )
}

// Define Celo Sepolia Testnet (New testnet replacing Alfajores)
// Alfajores will be sunset on September 30, 2025
export const celoSepolia = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  network: 'celo-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
    public: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'CeloScan',
      url: 'https://celo-sepolia.blockscout.com',
    },
  },
  testnet: true,
} as const satisfies Chain

// Define networks - Celo Sepolia (primary testnet) and Celo Mainnet
export const networks = [celoSepolia, celo]

// Metadata for your app (shown in wallet connection modals)
export const metadata = {
  name: 'Piano Style Blog',
  description: 'Developing My Piano Style - A blog and venue discovery platform',
  url: 'https://piano-style.vercel.app', // Update with your production URL
  icons: ['https://piano-style.vercel.app/static/favicons/favicon.ico'],
}

// Create Wagmi adapter with cookie storage for SSR support
// Configure transports with retry logic for Celo Sepolia
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [celoSepolia.id]: http('https://forno.celo-sepolia.celo-testnet.org', {
      batch: true,
      retryCount: 5,
      retryDelay: 1000,
      timeout: 30000,
    }),
  },
})

export const config = wagmiAdapter.wagmiConfig
