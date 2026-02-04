import { usePermissions } from '@/components/web3/WorkingWeb3Provider'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@prisma/client'

/**
 * Role-based permission hook
 * Provides user role and permission helper functions
 *
 * Checks both wallet-based permissions (WorkingWeb3Provider) and
 * session-based auth (AuthContext) to support both login methods.
 */
export function useRole() {
  const {
    role: walletRole,
    isBlogOwner: walletIsBlogOwner,
    isCurator: walletIsCurator,
    isValidator: walletIsValidator,
    canAccessCurator: walletCanAccessCurator,
    canAccessValidator: walletCanAccessValidator,
    canAccessAdmin: walletCanAccessAdmin,
  } = usePermissions()

  // Also check session-based auth for username/password users
  const { user } = useAuth()
  const sessionRole = user?.role

  // Use session role if available, otherwise fall back to wallet role
  // Session role takes precedence because it's more reliable for username/password auth
  const effectiveRole = sessionRole || walletRole || UserRole.SCOUT

  // Compute permission flags based on effective role
  const isBlogOwner = effectiveRole === UserRole.BLOG_OWNER || walletIsBlogOwner
  const isCurator = effectiveRole === UserRole.CURATOR || walletIsCurator
  const isValidator = effectiveRole === UserRole.VALIDATOR || walletIsValidator

  return {
    // Core role information
    role: effectiveRole,
    isBlogOwner,
    isCurator,
    isValidator,
    canAccessCurator: isCurator || isBlogOwner || walletCanAccessCurator,
    canAccessValidator: isValidator || isBlogOwner || walletCanAccessValidator,
    canAccessAdmin: isBlogOwner || walletCanAccessAdmin,

    // Permission helpers
    canCreateEvent: () => {
      return effectiveRole === UserRole.CURATOR || effectiveRole === UserRole.BLOG_OWNER
    },
    canEditVenue: () => {
      return effectiveRole === UserRole.CURATOR || effectiveRole === UserRole.BLOG_OWNER
    },
    canValidateVenue: () => {
      return effectiveRole === UserRole.VALIDATOR || effectiveRole === UserRole.BLOG_OWNER
    },
    canReferUsers: () => {
      return true // All users can refer
    },
    canManageCurators: () => {
      return effectiveRole === UserRole.BLOG_OWNER
    },
  }
}
