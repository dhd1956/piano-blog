import { usePermissions } from '@/components/web3/WorkingWeb3Provider'
import { UserRole } from '@prisma/client'

/**
 * Role-based permission hook
 * Provides user role and permission helper functions
 */
export function useRole() {
  const {
    role,
    isBlogOwner,
    isCurator,
    isValidator,
    canAccessCurator,
    canAccessValidator,
    canAccessAdmin,
  } = usePermissions()

  return {
    // Core role information
    role: role || UserRole.SCOUT,
    isBlogOwner,
    isCurator,
    isValidator,
    canAccessCurator,
    canAccessValidator,
    canAccessAdmin,

    // Permission helpers
    canCreateEvent: () => {
      return role === UserRole.CURATOR || role === UserRole.BLOG_OWNER
    },
    canEditVenue: () => {
      return role === UserRole.CURATOR || role === UserRole.BLOG_OWNER
    },
    canValidateVenue: () => {
      return role === UserRole.VALIDATOR || role === UserRole.BLOG_OWNER
    },
    canReferUsers: () => {
      return true // All users can refer
    },
    canManageCurators: () => {
      return role === UserRole.BLOG_OWNER
    },
  }
}
