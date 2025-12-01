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

          // Check if profile setup is needed
          if (data.profile && !data.profile.profileCompleted) {
            console.log('[OAuthEmailCapture] New OAuth user - redirecting to profile setup')
            // Redirect to profile setup for new users
            router.push('/profile/setup')
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
