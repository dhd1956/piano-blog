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
  const [privyChunkReady, setPrivyChunkReady] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Eagerly load the Privy chunk. When it resolves the browser has it cached,
    // so PrivyContextLayer renders synchronously (no null flash = no blank page).
    import('./PrivyProviderClient').then(() => setPrivyChunkReady(true))
  }, [])

  // Server render + first client render: children without Privy.
  // Matches server output exactly — no hydration mismatch.
  if (!mounted) return <>{children}</>

  // Chunk still downloading: show a spinner rather than rendering children
  // (children would throw — Privy hooks require the provider) or null (blank page).
  if (!privyChunkReady)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )

  // Chunk is cached — PrivyContextLayer renders synchronously, no blank flash.
  return (
    <PrivyInitBoundary fallback={<>{children}</>}>
      <PrivyContextLayer>{children}</PrivyContextLayer>
    </PrivyInitBoundary>
  )
}
