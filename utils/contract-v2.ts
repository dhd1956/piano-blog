/**
 * VenueRegistryV2 Contract Configuration and ABI
 * Improved UX version with user-facing data stored on-chain
 */

import { Contract } from 'web3-eth-contract'
import Web3 from 'web3'

// V2 Contract Configuration (update after deployment)
export const VENUE_REGISTRY_V2_ADDRESS = '0x' // TODO: Update after deployment
export const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'
export const CELO_CHAIN_ID = '0xaef3' // 44787 in hex

// VenueRegistryV2 ABI
export const VENUE_REGISTRY_V2_ABI = [
  // Read functions
  {
    "inputs": [{"name": "venueId", "type": "uint256"}],
    "name": "getVenueById",
    "outputs": [
      {
        "components": [
          {"name": "name", "type": "string"},
          {"name": "city", "type": "string"},
          {"name": "contactInfo", "type": "string"},
          {"name": "contactType", "type": "string"},
          {"name": "hasPiano", "type": "bool"},
          {"name": "hasJamSession", "type": "bool"},
          {"name": "verified", "type": "bool"},
          {"name": "venueType", "type": "uint8"},
          {"name": "submittedBy", "type": "address"},
          {"name": "verifiedBy", "type": "address"},
          {"name": "lastUpdatedBy", "type": "address"},
          {"name": "submissionTimestamp", "type": "uint32"},
          {"name": "verificationTimestamp", "type": "uint32"},
          {"name": "lastUpdatedTimestamp", "type": "uint32"},
          {"name": "ipfsHash", "type": "string"},
          {"name": "curatorNotes", "type": "string"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
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
    "inputs": [{"name": "city", "type": "string"}],
    "name": "getVenuesByCity",
    "outputs": [{"name": "", "type": "uint256[]"}],
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

  // Write functions
  {
    "inputs": [
      {"name": "name", "type": "string"},
      {"name": "city", "type": "string"},
      {"name": "contactInfo", "type": "string"},
      {"name": "contactType", "type": "string"},
      {"name": "hasPiano", "type": "bool"},
      {"name": "hasJamSession", "type": "bool"},
      {"name": "venueType", "type": "uint8"},
      {"name": "ipfsHash", "type": "string"}
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
      {"name": "newContactInfo", "type": "string"},
      {"name": "newContactType", "type": "string"},
      {"name": "newIpfsHash", "type": "string"}
    ],
    "name": "updateVenue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "venueId", "type": "uint256"},
      {"name": "approved", "type": "bool"},
      {"name": "notes", "type": "string"}
    ],
    "name": "verifyVenue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// Gas estimates for V2 (higher but better UX)
export const GAS_ESTIMATES_V2 = {
  SUBMIT_VENUE: 250000,
  UPDATE_VENUE: 150000,
  VERIFY_VENUE: 100000
} as const

export function createV2Contract(web3: Web3): Contract {
  return new web3.eth.Contract(VENUE_REGISTRY_V2_ABI as any, VENUE_REGISTRY_V2_ADDRESS)
}