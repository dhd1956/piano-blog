'use client'

import { useAppKitAccount } from '@reown/appkit/react'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * OAuthEmailCapture Component
 *
 * Automatically captures email from OAuth providers (Google, etc.) when a user
 * first connects and sends it to the profile API for user creation.
 *
 * For OAuth users:
 * - Email is auto-verified (since OAuth provider verified it)
 * - Redirects new users to profile setup wizard
 * - Existing users skip profile setup
 */
export default function OAuthEmailCapture() {
  const { address, isConnected, embeddedWalletInfo } = useAppKitAccount()
  const hasProcessedRef = useRef<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    const captureEmail = async () => {
      // Only process if:
      // 1. User is connected
      // 2. We have a wallet address
      // 3. We have embedded wallet info (OAuth login)
      // 4. Email is available from OAuth provider
      // 5. We haven't already processed this address
      if (
        !isConnected ||
        !address ||
        !embeddedWalletInfo?.user?.email ||
        hasProcessedRef.current.has(address)
      ) {
        return
      }

      const email = embeddedWalletInfo.user.email
      const authProvider = embeddedWalletInfo.authProvider

      console.log(`[OAuthEmailCapture] Detected ${authProvider} login with email: ${email}`)

      try {
        // Call profile API with email and emailVerified query parameters
        // This will auto-create user with email if they don't exist
        const response = await fetch(
          `/api/profile/${address}?email=${encodeURIComponent(email)}&emailVerified=true&authProvider=${authProvider}`
        )

        if (response.ok) {
          const data = await response.json()
          console.log(`[OAuthEmailCapture] Successfully captured email for user ${address}`)

          // Mark this address as processed to avoid duplicate calls
          hasProcessedRef.current.add(address)

          // Smart completion logic: Check if user has essential fields
          const profile = data.profile
          const hasEssentialFields = !!(profile?.username && profile?.displayName && profile?.email)

          // Auto-complete profile if user has essential fields but profileCompleted is false
          if (profile && hasEssentialFields && !profile.profileCompleted) {
            console.log('[OAuthEmailCapture] User has essential fields - auto-completing profile')
            try {
              await fetch(`/api/profile/${address}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  requesterAddress: address,
                  profileCompleted: true,
                  profileCompletedAt: new Date().toISOString(),
                }),
              })
              console.log('[OAuthEmailCapture] Profile auto-completed')
            } catch (err) {
              console.error('[OAuthEmailCapture] Failed to auto-complete profile:', err)
            }
          }
          // Only redirect to setup if user is truly new (no username)
          else if (profile && !profile.username) {
            console.log(
              '[OAuthEmailCapture] New user without username - redirecting to profile setup'
            )
            router.push('/profile/setup')
          } else {
            console.log('[OAuthEmailCapture] Returning user - no setup needed')
          }
        } else {
          console.warn(`[OAuthEmailCapture] Failed to capture email: ${response.statusText}`)
        }
      } catch (error) {
        console.error('[OAuthEmailCapture] Error capturing email:', error)
      }
    }

    captureEmail()
  }, [isConnected, address, embeddedWalletInfo, router])

  // This component doesn't render anything
  return null
}
