import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo } from 'viem/chains'
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
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const metadata = {
  name: 'GlobalPiano.Network',
  description: 'Discover piano-friendly venues and connect with the global piano community',
  url: APP_URL,
  icons: [`${APP_URL}/static/favicons/favicon.ico`],
}

// Get paymaster configuration from environment
const paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL || ''

// Auth-aware storage wrapper for wagmi.
// Delegates to cookieStorage but returns null for reads when the user isn't
// authenticated. This prevents wagmi from auto-reconnecting a persisted wallet
// session for unauthenticated users, which would trigger a SIWE "sign this
// message" popup before React can intervene.
//
// We check for `auth_active` (a non-HttpOnly companion cookie set by middleware)
// because `auth_token` is HttpOnly and invisible to JavaScript.
//
// IMPORTANT: On the server (SSR), we also return null. Without this, SSR reads
// stale wagmi cookies from the request, hydrates the client with that state,
// and wagmi tries to reconnect — triggering SIWE even though the client-side
// check would have returned null.
// See: https://github.com/reown-com/appkit/issues/2218
const authAwareCookieStorage = {
  getItem(key: string): string | null {
    // On the server, always return null — we don't want SSR to hydrate with
    // stale wallet state that triggers reconnection on the client.
    if (typeof document === 'undefined') {
      return null
    }
    // On the client, block reads when not authenticated.
    if (!document.cookie.includes('auth_active=')) {
      return null
    }
    return cookieStorage.getItem(key)
  },
  setItem(key: string, value: string): void {
    cookieStorage.setItem(key, value)
  },
  removeItem(key: string): void {
    cookieStorage.removeItem(key)
  },
}

// Create Wagmi adapter with auth-aware cookie storage for SSR support
// Configure transports with retry logic for Celo Sepolia
// Using Ankr as primary (fastest according to chainlist)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: authAwareCookieStorage,
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
          'claimNewUserReward',
          'transfer',
        ],
      },
    },
  }),
})

export const config = wagmiAdapter.wagmiConfig
