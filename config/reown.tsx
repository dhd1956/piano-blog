import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, celoAlfajores } from '@reown/appkit/networks'

// Get project ID from environment
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || ''

if (!projectId || projectId.includes('placeholder')) {
  console.warn(
    '⚠️ NEXT_PUBLIC_REOWN_PROJECT_ID is not set or using placeholder value.\n' +
      'Get a real Project ID from https://cloud.reown.com/ for wallet connection features to work.\n' +
      'WalletConnect features will be disabled.'
  )
}

// Define networks - Celo Alfajores (testnet) and Celo Mainnet
export const networks = [celoAlfajores, celo]

// Metadata for your app (shown in wallet connection modals)
export const metadata = {
  name: 'Piano Style Blog',
  description: 'Developing My Piano Style - A blog and venue discovery platform',
  url: 'https://piano-style.vercel.app', // Update with your production URL
  icons: ['https://piano-style.vercel.app/static/favicons/favicon.ico'],
}

// Create Wagmi adapter with cookie storage for SSR support
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
})

export const config = wagmiAdapter.wagmiConfig
