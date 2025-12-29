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
export const celoSepolia: Chain = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: [
        'https://rpc.ankr.com/celo_sepolia',
        'https://forno.celo-sepolia.celo-testnet.org',
        'https://celo-sepolia.gateway.tatum.io',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'CeloScan',
      url: 'https://celo-sepolia.blockscout.com',
    },
  },
  testnet: true,
}

// Define networks - Celo Sepolia (primary testnet) and Celo Mainnet
export const networks = [celoSepolia, celo]

// Metadata for your app (shown in wallet connection modals)
export const metadata = {
  name: 'Piano Style Blog',
  description: 'Developing My Piano Style - A blog and venue discovery platform',
  url: 'https://piano-blog.vercel.app',
  icons: ['https://piano-blog.vercel.app/static/favicons/favicon.ico'],
}

// Get paymaster configuration from environment
const paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL || ''

// Create Wagmi adapter with cookie storage for SSR support
// Configure transports with retry logic for Celo Sepolia
// Using Ankr as primary (fastest according to chainlist)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [celoSepolia.id]: http('https://rpc.ankr.com/celo_sepolia', {
      batch: true,
      retryCount: 5,
      retryDelay: 1000,
      timeout: 30000,
    }),
  },
  // Account abstraction with gas sponsorship
  // Only enabled when NEXT_PUBLIC_PAYMASTER_URL is configured
  ...(paymasterUrl && {
    accountAbstraction: {
      sponsorGas: true,
      paymasterUrl,
      paymasterContext: {
        // Sponsor specific methods only (defined in lib/gas-sponsorship.ts)
        sponsoredMethods: [
          'submitVenue',
          'verifyVenue',
          'rsvpToEvent',
          'updateProfile',
          'createEvent',
        ],
      },
    },
  }),
})

export const config = wagmiAdapter.wagmiConfig
