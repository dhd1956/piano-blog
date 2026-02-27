/**
 * Gas Sponsorship Policies
 * Defines which transactions are sponsored and rate limits
 *
 * This module controls the paymaster sponsorship behavior for
 * blockchain transactions on the Global Piano Network.
 */

/**
 * Sponsorship configuration
 */
export const sponsorshipPolicies = {
  // Contract methods that will have gas fees sponsored by the platform
  sponsoredMethods: [
    'submitVenue', // Venue submission
    'verifyVenue', // Curator verification
    'rsvpToEvent', // Event RSVP
    'updateProfile', // Profile updates
    'createEvent', // Event creation
    'claimNewUserReward', // Welcome PXP claim
    'transfer', // PXP tips (testnet only — use permit on mainnet)
  ],

  // Rate limits (transactions per user per day)
  // Prevents abuse and controls costs
  rateLimits: {
    submitVenue: 3, // Max 3 venue submissions per day
    verifyVenue: 50, // Max 50 verifications per day (for curators)
    rsvpToEvent: 10, // Max 10 RSVPs per day
    updateProfile: 5, // Max 5 profile updates per day
    createEvent: 2, // Max 2 events per day
    claimNewUserReward: 1, // One-time welcome reward
    transfer: 50, // Max 50 tips per day
  },

  // Methods that will NEVER be sponsored
  blockedMethods: [
    'approve', // Token approvals
    'deploy', // Contract deployments
  ],

  // Cost monitoring thresholds
  budgetLimits: {
    dailyMaxUSD: 10, // Max $10/day spending
    monthlyMaxUSD: 300, // Max $300/month spending
    alertThreshold: 0.75, // Alert at 75% of budget
  },
}

/**
 * Check if a transaction method should be sponsored
 * @param method - The contract method being called
 * @returns boolean - Whether the transaction should be sponsored
 */
export function shouldSponsorTransaction(method: string): boolean {
  // Check if method is blocked
  if (sponsorshipPolicies.blockedMethods.includes(method)) {
    return false
  }

  // Check if method is in sponsored list
  if (sponsorshipPolicies.sponsoredMethods.includes(method)) {
    return true
  }

  // Default: don't sponsor unknown methods
  return false
}

/**
 * Get rate limit for a specific method
 * @param method - The contract method being called
 * @returns number - Maximum transactions per day for this method
 */
export function getRateLimit(method: string): number {
  return sponsorshipPolicies.rateLimits[method as keyof typeof sponsorshipPolicies.rateLimits] || 0
}

/**
 * Transaction tracking interface for rate limiting
 */
export interface TransactionRecord {
  userId: number
  method: string
  timestamp: Date
  sponsored: boolean
  gasUsed?: string
  txHash?: string
}

/**
 * Check if user has exceeded rate limit for a method
 * This should be implemented with database/Redis in production
 *
 * @param userId - The user's ID
 * @param method - The contract method being called
 * @param transactions - Recent transaction history
 * @returns boolean - Whether user has exceeded rate limit
 */
export function hasExceededRateLimit(
  userId: number,
  method: string,
  transactions: TransactionRecord[]
): boolean {
  const limit = getRateLimit(method)
  if (limit === 0) return true // Method not configured

  // Get transactions from last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentTransactions = transactions.filter(
    (tx) =>
      tx.userId === userId && tx.method === method && tx.timestamp >= oneDayAgo && tx.sponsored
  )

  return recentTransactions.length >= limit
}

/**
 * Format gas cost for display
 * @param gasCost - Gas cost in wei or USD
 * @param unit - 'wei' or 'usd'
 * @returns string - Formatted cost
 */
export function formatGasCost(gasCost: number, unit: 'wei' | 'usd' = 'usd'): string {
  if (unit === 'usd') {
    return `$${gasCost.toFixed(4)}`
  }
  return `${gasCost} wei`
}
