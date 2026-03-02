'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, type ReactNode } from 'react'

// PrivyProviderClient is excluded from the server bundle (ssr: false) so that
// @privy-io/react-auth and its browser-only dependencies (WalletConnect,
// Solana WASM, etc.) are never imported in Node.js during static generation.
const PrivyProviderClient = dynamic(
  () => import('./PrivyProviderClient').then((m) => ({ default: m.PrivyProviderClient })),
  { ssr: false }
)

export function PrivyAppProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Server render + first client render: children without any Privy context.
  // Matches server output exactly, so no hydration mismatch occurs.
  if (!mounted) return <>{children}</>

  // After client mount: wrap children in the full Privy + Wagmi provider tree.
  return <PrivyProviderClient>{children}</PrivyProviderClient>
}
