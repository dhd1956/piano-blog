/**
 * Smart Contract Configuration and ABI Definitions
 * for VenueRegistry Contract on Celo Alfajores Testnet
 */

import { Contract } from 'web3-eth-contract'
import Web3 from 'web3'

// Contract Configuration  
export const VENUE_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x29FC1Cc9D4451896CaDD41ceA7C6aBd1E71Ab3B2'
export const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'
export const CELO_TESTNET_RPC_BACKUP = 'https://celo-alfajores.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
export const CELO_TESTNET_RPC_LIST = [
  CELO_TESTNET_RPC,
  CELO_TESTNET_RPC_BACKUP,
  'https://celo-alfajores.infura.io/v3/demo'
]
export const CELO_CHAIN_ID = '0xaef3' // 44787 in hex

// Enhanced VenueRegistry ABI - V3 with IPFS and curator support
export const VENUE_REGISTRY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"name": "venueId", "type": "uint256"}],
    "name": "getVenueById",
    "outputs": [{"name": "", "type": "tuple", "components": [
      {"name": "name", "type": "string"},
      {"name": "city", "type": "string"},
      {"name": "contactInfo", "type": "string"},
      {"name": "contactType", "type": "string"},
      {"name": "ipfsHash", "type": "string"},
      {"name": "submittedBy", "type": "address"},
      {"name": "timestamp", "type": "uint32"},
      {"name": "hasPiano", "type": "bool"},
      {"name": "hasJamSession", "type": "bool"},
      {"name": "verified", "type": "bool"},
      {"name": "venueType", "type": "uint8"}
    ]}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "venueCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "name", "type": "string"},
      {"name": "city", "type": "string"},
      {"name": "contactInfo", "type": "string"},
      {"name": "contactType", "type": "string"},
      {"name": "ipfsHash", "type": "string"},
      {"name": "hasPiano", "type": "bool"},
      {"name": "hasJamSession", "type": "bool"},
      {"name": "venueType", "type": "uint8"}
    ],
    "name": "submitVenue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "venueId", "type": "uint256"},
      {"name": "newName", "type": "string"},
      {"name": "newContactInfo", "type": "string"}
    ],
    "name": "updateVenue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "venueId", "type": "uint256"},
      {"name": "newIPFSHash", "type": "string"}
    ],
    "name": "updateIPFSHash",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "venueId", "type": "uint256"},
      {"name": "newName", "type": "string"},
      {"name": "newContactInfo", "type": "string"},
      {"name": "newIPFSHash", "type": "string"}
    ],
    "name": "updateVenueWithIPFS",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "venueId", "type": "uint256"},
      {"name": "approved", "type": "bool"}
    ],
    "name": "verifyVenue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "curator", "type": "address"}],
    "name": "addCurator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "curator", "type": "address"}],
    "name": "removeCurator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "curator", "type": "address"}],
    "name": "isCurator",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "ipfsHash", "type": "string"}],
    "name": "setCuratorProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "startId", "type": "uint256"},
      {"name": "endId", "type": "uint256"}
    ],
    "name": "getVenuesByRange",
    "outputs": [{"name": "", "type": "tuple[]", "components": [
      {"name": "name", "type": "string"},
      {"name": "city", "type": "string"},
      {"name": "contactInfo", "type": "string"},
      {"name": "contactType", "type": "string"},
      {"name": "ipfsHash", "type": "string"},
      {"name": "submittedBy", "type": "address"},
      {"name": "timestamp", "type": "uint32"},
      {"name": "hasPiano", "type": "bool"},
      {"name": "hasJamSession", "type": "bool"},
      {"name": "verified", "type": "bool"},
      {"name": "venueType", "type": "uint8"}
    ]}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "city", "type": "string"}],
    "name": "getVenuesByCity",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
]

// Minimal ABI for read-only operations (gas optimization)
export const VENUE_REGISTRY_READ_ABI = [
  {
    "inputs": [{"name": "venueId", "type": "uint256"}],
    "name": "getVenueById",
    "outputs": [{"name": "", "type": "tuple", "components": [
      {"name": "name", "type": "string"},
      {"name": "city", "type": "string"},
      {"name": "contactInfo", "type": "string"},
      {"name": "hasPiano", "type": "bool"},
      {"name": "verified", "type": "bool"},
      {"name": "submittedBy", "type": "address"},
      {"name": "timestamp", "type": "uint32"}
    ]}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "venueCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]

// Contract factory functions
export function createReadOnlyContract(web3: Web3): Contract {
  return new web3.eth.Contract(VENUE_REGISTRY_READ_ABI as any, VENUE_REGISTRY_ADDRESS)
}

export function createFullContract(web3: Web3): Contract {
  return new web3.eth.Contract(VENUE_REGISTRY_ABI as any, VENUE_REGISTRY_ADDRESS)
}

// Gas estimation constants
export const GAS_ESTIMATES = {
  SUBMIT_VENUE: 300000,
  VERIFY_VENUE: 150000,
  UPDATE_VENUE_IPFS: 100000,
  REWARD_CONTRIBUTOR: 80000,
  SET_BASE_REWARD: 60000
} as const

// Transaction configuration
export const TX_CONFIG = {
  DEFAULT_GAS_LIMIT: 500000,
  DEFAULT_GAS_PRICE_MULTIPLIER: 1.2, // 20% buffer
  MAX_GAS_PRICE: '10000000000', // 10 Gwei in wei
  CONFIRMATION_BLOCKS: 2
} as const

// Network configuration for Celo
export const CELO_NETWORK_CONFIG = {
  chainId: CELO_CHAIN_ID,
  chainName: 'Celo Alfajores Testnet',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18
  },
  rpcUrls: [CELO_TESTNET_RPC],
  blockExplorerUrls: ['https://alfajores.celoscan.io/']
} as const

// Utility functions for contract interactions
export async function switchToCeloNetwork(): Promise<boolean> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask not found')
  }

  try {
    // Try to switch to Celo network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CELO_CHAIN_ID }]
    })
    return true
  } catch (error: any) {
    // If network doesn't exist, add it
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [CELO_NETWORK_CONFIG]
        })
        return true
      } catch (addError) {
        console.error('Failed to add Celo network:', addError)
        return false
      }
    } else {
      console.error('Failed to switch to Celo network:', error)
      return false
    }
  }
}

export async function getCurrentChainId(): Promise<string | null> {
  if (typeof window.ethereum === 'undefined') {
    return null
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    return chainId
  } catch (error) {
    console.error('Failed to get chain ID:', error)
    return null
  }
}

export async function isOnCeloNetwork(): Promise<boolean> {
  const chainId = await getCurrentChainId()
  return chainId === CELO_CHAIN_ID
}

// Contract event filters
export const EVENT_FILTERS = {
  VENUE_SUBMITTED: {
    address: VENUE_REGISTRY_ADDRESS,
    topics: [Web3.utils.keccak256('VenueSubmitted(uint256,address,string,string,bytes32)')]
  },
  VENUE_VERIFIED: {
    address: VENUE_REGISTRY_ADDRESS,
    topics: [Web3.utils.keccak256('VenueVerified(uint256,address,bool,uint256)')]
  },
  VENUE_UPDATED: {
    address: VENUE_REGISTRY_ADDRESS,
    topics: [Web3.utils.keccak256('VenueUpdated(uint256,address,string)')]
  }
} as const

// Error handling types
export interface ContractError {
  code: number
  message: string
  data?: any
}

export function isContractError(error: any): error is ContractError {
  return error && typeof error.code === 'number' && typeof error.message === 'string'
}

// Contract interaction helpers
export async function estimateGas(
  contract: Contract,
  method: string,
  params: any[],
  from: string
): Promise<number> {
  try {
    const gasEstimate = await contract.methods[method](...params).estimateGas({ from })
    return Math.floor(gasEstimate * TX_CONFIG.DEFAULT_GAS_PRICE_MULTIPLIER)
  } catch (error) {
    console.error(`Gas estimation failed for ${method}:`, error)
    return GAS_ESTIMATES[method.toUpperCase() as keyof typeof GAS_ESTIMATES] || TX_CONFIG.DEFAULT_GAS_LIMIT
  }
}

export async function getCurrentGasPrice(web3: Web3): Promise<string> {
  try {
    const gasPrice = await web3.eth.getGasPrice()
    const adjustedPrice = Math.floor(Number(gasPrice) * TX_CONFIG.DEFAULT_GAS_PRICE_MULTIPLIER)
    return Math.min(adjustedPrice, Number(TX_CONFIG.MAX_GAS_PRICE)).toString()
  } catch (error) {
    console.error('Failed to get gas price:', error)
    return TX_CONFIG.MAX_GAS_PRICE
  }
}

// Type definitions for contract methods (VenueRegistry_Fixed)
export interface ContractMethods {
  // Read methods (available in new contract)
  getVenueById(venueId: number): Promise<any>
  venueCount(): Promise<number>
  owner(): Promise<string>
  
  // Write methods (available in new contract)
  submitVenue(name: string, city: string, contactInfo: string, hasPiano: boolean): Promise<any>
  verifyVenue(venueId: number, approved: boolean): Promise<any>
  updateVenue(venueId: number, newName: string, newContactInfo: string): Promise<any>
}

// Export default configuration
export default {
  address: VENUE_REGISTRY_ADDRESS,
  abi: VENUE_REGISTRY_ABI,
  readAbi: VENUE_REGISTRY_READ_ABI,
  rpcUrl: CELO_TESTNET_RPC,
  chainId: CELO_CHAIN_ID,
  gasEstimates: GAS_ESTIMATES,
  txConfig: TX_CONFIG,
  networkConfig: CELO_NETWORK_CONFIG
}