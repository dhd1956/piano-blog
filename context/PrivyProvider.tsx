'use client'

import dynamic from 'next/dynamic'
import { Component, useState, useEffect, type ReactNode, type ErrorInfo } from 'react'

// PrivyProviderClient is excluded from the server bundle (ssr: false) so that
// @privy-io/react-auth, @privy-io/wagmi, and their browser-only dependencies
// (WalletConnect, Solana WASM, etc.) never execute in Node.js during static
// generation or SSR.
const PrivyContextLayer = dynamic(
  () => import('./PrivyProviderClient').then((m) => ({ default: m.PrivyProviderClient })),
  { ssr: false }
)

// Catches errors from PrivyProvider / WagmiProvider initialization so a bad
// Privy config doesn't crash the whole app. Falls back to rendering children
// without auth context, and logs the specific error to the console.
class PrivyInitBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      '[PrivyProvider] Privy/Wagmi initialization threw — auth will be unavailable until the page is refreshed:',
      error.message,
      '\nComponent stack:',
      info.componentStack
    )
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function PrivyAppProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Server render + first client render: children without any Privy/Wagmi
  // context. Matches server output exactly — no hydration mismatch.
  if (!mounted) return <>{children}</>

  // After client mount: wrap children in the full provider tree.
  // PrivyInitBoundary prevents a Privy init error from crashing the whole page.
  return (
    <PrivyInitBoundary fallback={<>{children}</>}>
      <PrivyContextLayer>{children}</PrivyContextLayer>
    </PrivyInitBoundary>
  )
}
