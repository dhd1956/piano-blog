/**
 * CAV Rewards Contract Configuration
 * Simplified contract focused only on rewards and payment tracking
 */

import Web3 from 'web3'

// Contract addresses (update after deployment)
// For development: using zero address to prevent accidental token transfers
export const CAV_REWARDS_ADDRESS =
  process.env.NEXT_PUBLIC_CAV_REWARDS_ADDRESS || '0x0000000000000000000000000000000000000000'
export const CAV_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_CAV_TOKEN_ADDRESS || '0xe787A01BafC3276D0B3fEB93159F60dbB99b889F'

// Network configuration
export const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'
export const CELO_CHAIN_ID = '0xaef3' // 44787 in hex

// Reward amounts (in CAV tokens)
export const REWARD_AMOUNTS = {
  NEW_USER: 25,
  SCOUT: 50,
  VERIFIER: 25,
} as const

// CAV Rewards Contract ABI
export const CAV_REWARDS_ABI = [
  {
    inputs: [{ name: '_cavToken', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'claimNewUserReward',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'venueHash', type: 'bytes32' },
      { name: 'scout', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    name: 'verifyVenue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'memo', type: 'string' },
    ],
    name: 'trackPayment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'city', type: 'string' },
      { name: 'scout', type: 'address' },
    ],
    name: 'generateVenueHash',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [{ name: 'venueHash', type: 'bytes32' }],
    name: 'isVenueVerified',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'venueHash', type: 'bytes32' }],
    name: 'getVenueVerificationInfo',
    outputs: [
      { name: 'verificationCount', type: 'uint256' },
      { name: 'scoutPaid', type: 'bool' },
      { name: 'isVerified', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getContractBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'fundRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'verifier', type: 'address' },
      { name: 'authorized', type: 'bool' },
    ],
    name: 'setVerifierStatus',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'authorizedVerifiers',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'hasClaimedNewUserReward',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'NewUserRewarded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'scout', type: 'address' },
      { indexed: true, name: 'venueHash', type: 'bytes32' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'ScoutRewarded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'verifier', type: 'address' },
      { indexed: true, name: 'venueHash', type: 'bytes32' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'VerifierRewarded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'venueHash', type: 'bytes32' },
      { indexed: true, name: 'verifier', type: 'address' },
      { indexed: false, name: 'approved', type: 'bool' },
    ],
    name: 'VenueVerified',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'memo', type: 'string' },
    ],
    name: 'PaymentTracked',
    type: 'event',
  },
] as const

// Standard ERC-20 ABI (for CAV token)
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const

/**
 * Contract utility functions
 */
export class CAVRewardsService {
  private web3: Web3
  private rewardsContract: any
  private tokenContract: any
  private isDevelopment: boolean

  constructor(web3Instance?: Web3) {
    this.web3 = web3Instance || new Web3(CELO_TESTNET_RPC)
    this.isDevelopment = CAV_REWARDS_ADDRESS === '0x0000000000000000000000000000000000000000'

    // Only create contracts if not in development mode with zero address
    if (!this.isDevelopment) {
      this.rewardsContract = new this.web3.eth.Contract(CAV_REWARDS_ABI, CAV_REWARDS_ADDRESS)
      this.tokenContract = new this.web3.eth.Contract(ERC20_ABI, CAV_TOKEN_ADDRESS)
    }
  }

  /**
   * Generate venue hash for blockchain operations
   */
  generateVenueHash(name: string, city: string, scoutAddress: string): Promise<string> {
    return this.rewardsContract.methods.generateVenueHash(name, city, scoutAddress).call()
  }

  /**
   * Check if user has claimed new user reward
   */
  hasClaimedNewUserReward(userAddress: string): Promise<boolean> {
    return this.rewardsContract.methods.hasClaimedNewUserReward(userAddress).call()
  }

  /**
   * Check if address is authorized verifier
   */
  isAuthorizedVerifier(address: string): Promise<boolean> {
    return this.rewardsContract.methods.authorizedVerifiers(address).call()
  }

  /**
   * Get venue verification info
   */
  getVenueVerificationInfo(venueHash: string): Promise<{
    verificationCount: number
    scoutPaid: boolean
    isVerified: boolean
  }> {
    return this.rewardsContract.methods.getVenueVerificationInfo(venueHash).call()
  }

  /**
   * Get CAV token balance for address
   */
  getCAVBalance(address: string): Promise<string> {
    return this.tokenContract.methods.balanceOf(address).call()
  }

  /**
   * Get contract CAV balance (for rewards funding)
   */
  getContractBalance(): Promise<string> {
    return this.rewardsContract.methods.getContractBalance().call()
  }

  /**
   * Claim new user reward (requires wallet connection)
   */
  async claimNewUserReward(fromAddress: string) {
    const gasEstimate = await this.rewardsContract.methods
      .claimNewUserReward()
      .estimateGas({ from: fromAddress })

    return this.rewardsContract.methods
      .claimNewUserReward()
      .send({ from: fromAddress, gas: gasEstimate })
  }

  /**
   * Verify venue (curator only)
   */
  async verifyVenue(
    venueHash: string,
    scoutAddress: string,
    approved: boolean,
    fromAddress: string
  ) {
    const gasEstimate = await this.rewardsContract.methods
      .verifyVenue(venueHash, scoutAddress, approved)
      .estimateGas({ from: fromAddress })

    return this.rewardsContract.methods
      .verifyVenue(venueHash, scoutAddress, approved)
      .send({ from: fromAddress, gas: gasEstimate })
  }

  /**
   * Track payment (for transparency)
   */
  async trackPayment(toAddress: string, amount: string, memo: string, fromAddress: string) {
    // In development mode, just log the payment instead of calling contract
    if (this.isDevelopment) {
      console.log('🔧 Development Mode: Payment tracked locally', {
        from: fromAddress,
        to: toAddress,
        amount: amount + ' CAV',
        memo,
        timestamp: new Date().toISOString(),
      })
      return {
        transactionHash: `dev-tx-${Date.now()}`,
        status: 'success',
      }
    }

    const gasEstimate = await this.rewardsContract.methods
      .trackPayment(toAddress, this.web3.utils.toWei(amount, 'ether'), memo)
      .estimateGas({ from: fromAddress })

    return this.rewardsContract.methods
      .trackPayment(toAddress, this.web3.utils.toWei(amount, 'ether'), memo)
      .send({ from: fromAddress, gas: gasEstimate })
  }

  /**
   * Transfer CAV tokens directly
   */
  async transferCAV(toAddress: string, amount: string, fromAddress: string) {
    // In development mode, simulate the transfer without calling real contract
    if (this.isDevelopment) {
      console.log('🔧 Development Mode: CAV transfer simulated', {
        from: fromAddress,
        to: toAddress,
        amount: amount + ' CAV',
        note: 'No real tokens transferred in development',
        timestamp: new Date().toISOString(),
      })
      return {
        transactionHash: `dev-transfer-${Date.now()}`,
        status: 'success',
        events: {},
        gasUsed: 21000, // Simulate gas usage
      }
    }

    const gasEstimate = await this.tokenContract.methods
      .transfer(toAddress, this.web3.utils.toWei(amount, 'ether'))
      .estimateGas({ from: fromAddress })

    return this.tokenContract.methods
      .transfer(toAddress, this.web3.utils.toWei(amount, 'ether'))
      .send({ from: fromAddress, gas: gasEstimate })
  }
}

export default CAVRewardsService
