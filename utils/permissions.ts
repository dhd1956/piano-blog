// Contract configuration
const VENUE_REGISTRY_ADDRESS = '0x29FC1Cc9D4451896CaDD41ceA7C6aBd1E71Ab3B2'
const CELO_TESTNET_RPC = 'https://alfajores-forno.celo-testnet.org'

// Get Blog Owner address from environment
const BLOG_OWNER_ADDRESS = process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.toLowerCase()

export interface PermissionCheck {
  isBlogOwner: boolean
  isVenueCurator: boolean
  canEdit: boolean
  canUpdateCurator: boolean
}

/**
 * Check if the given address is the blog owner
 */
export function isBlogOwner(address: string | undefined): boolean {
  if (!address || !BLOG_OWNER_ADDRESS) return false
  return address.toLowerCase() === BLOG_OWNER_ADDRESS
}

/**
 * Check venue-specific permissions for a user (client-side only)
 */
export async function checkVenuePermissions(
  userAddress: string | undefined,
  venueId: number
): Promise<PermissionCheck> {
  const result: PermissionCheck = {
    isBlogOwner: false,
    isVenueCurator: false,
    canEdit: false,
    canUpdateCurator: false
  }

  if (!userAddress) return result

  const normalizedAddress = userAddress.toLowerCase()
  
  // Check if user is blog owner
  result.isBlogOwner = isBlogOwner(normalizedAddress)
  
  // Blog owner has all permissions
  if (result.isBlogOwner) {
    result.isVenueCurator = true
    result.canEdit = true
    result.canUpdateCurator = true
    return result
  }

  // For client-side, we can't check contract state directly
  // This should be handled by the Web3Provider or useWallet hook
  console.log('Contract-based permission check should be handled by Web3Provider')
  
  return result
}

/**
 * Check general curator permissions (client-side only)
 */
export async function checkCuratorPermissions(
  userAddress: string | undefined
): Promise<{ isBlogOwner: boolean; isAuthorizedCurator: boolean }> {
  if (!userAddress) {
    return { isBlogOwner: false, isAuthorizedCurator: false }
  }

  const normalizedAddress = userAddress.toLowerCase()
  const blogOwner = isBlogOwner(normalizedAddress)

  if (blogOwner) {
    return { isBlogOwner: true, isAuthorizedCurator: true }
  }

  // For client-side, we can't check contract state directly
  // This should be handled by the Web3Provider with proper Web3 instance
  console.log('Contract-based curator check should be handled by Web3Provider')
  return { isBlogOwner: false, isAuthorizedCurator: false }
}

/**
 * Client-side permission check without blockchain call
 * Use this for immediate UI rendering, then call async functions for verification
 */
export function getClientPermissions(
  userAddress: string | undefined
): { isBlogOwner: boolean } {
  return {
    isBlogOwner: isBlogOwner(userAddress)
  }
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}