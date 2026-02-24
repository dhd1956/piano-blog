import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@prisma/client'

/**
 * Role-based permission hook
 * Provides user role and permission helper functions
 *
 * Uses session-based auth (AuthContext) as the source of truth for roles.
 */
export function useRole() {
  const { user } = useAuth()
  const effectiveRole = user?.role || UserRole.SCOUT

  const isBlogOwner = effectiveRole === UserRole.BLOG_OWNER
  const isCurator = effectiveRole === UserRole.CURATOR
  const isValidator = effectiveRole === UserRole.VALIDATOR

  return {
    // Core role information
    role: effectiveRole,
    isBlogOwner,
    isCurator,
    isValidator,
    canAccessCurator: isCurator || isBlogOwner,
    canAccessValidator: isValidator || isBlogOwner,
    canAccessAdmin: isBlogOwner,

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
