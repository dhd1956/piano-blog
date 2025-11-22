import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, celoAlfajores } from '@reown/appkit/networks'
import { http } from 'wagmi'

// Get project ID from environment
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || ''

if (!projectId || projectId.includes('placeholder')) {
  console.warn(
    '⚠️ NEXT_PUBLIC_REOWN_PROJECT_ID is not set or using placeholder value.\n' +
      'Get a real Project ID from https://cloud.reown.com/ for wallet connection features to work.\n' +
      'WalletConnect features will be disabled.'
  )
}

// Configure custom RPC endpoints with multiple fallbacks for Celo Alfajores
// Using multiple endpoints to handle WSL networking issues
const celoAlfajoresWithRPC = {
  ...celoAlfajores,
  rpcUrls: {
    default: {
      http: [
        'https://alfajores-forno.celo-testnet.org',
        'https://rpc.ankr.com/celo_alfajores',
        'https://celo-alfajores-rpc.allthatnode.com',
      ],
    },
    public: {
      http: [
        'https://alfajores-forno.celo-testnet.org',
        'https://rpc.ankr.com/celo_alfajores',
        'https://celo-alfajores-rpc.allthatnode.com',
      ],
    },
  },
}

// Define networks - Celo Alfajores (testnet) and Celo Mainnet
export const networks = [celoAlfajoresWithRPC, celo]

// Metadata for your app (shown in wallet connection modals)
export const metadata = {
  name: 'Piano Style Blog',
  description: 'Developing My Piano Style - A blog and venue discovery platform',
  url: 'https://piano-style.vercel.app', // Update with your production URL
  icons: ['https://piano-style.vercel.app/static/favicons/favicon.ico'],
}

// Create Wagmi adapter with cookie storage for SSR support
// Configure transports with multiple RPC fallbacks and retry logic
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org', {
      batch: true,
      retryCount: 5,
      retryDelay: 1000,
      timeout: 30000,
    }),
  },
})

export const config = wagmiAdapter.wagmiConfig
