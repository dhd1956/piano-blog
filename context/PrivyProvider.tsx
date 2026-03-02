'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, type ReactNode } from 'react'

// PrivyProviderClient is excluded from the server bundle (ssr: false) so that
// @privy-io/react-auth, @privy-io/wagmi, and their browser-only dependencies
// (WalletConnect, Solana WASM, etc.) never execute in Node.js during static
// generation or SSR.
//
// The layout's SSR-rendered components no longer call any wagmi hooks
// (AuthButton.useDisconnect was removed in the Privy migration), so there is
// no need for a WagmiProvider at the SSR layer.
const PrivyContextLayer = dynamic(
  () => import('./PrivyProviderClient').then((m) => ({ default: m.PrivyProviderClient })),
  { ssr: false }
)

export function PrivyAppProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Server render + first client render: children without any Privy/Wagmi
  // context. Matches server output exactly — no hydration mismatch.
  if (!mounted) return <>{children}</>

  // After client mount: wrap children in the full provider tree.
  return <PrivyContextLayer>{children}</PrivyContextLayer>
}
