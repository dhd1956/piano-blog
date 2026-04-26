'use client'

import dynamic from 'next/dynamic'
import {
  Component,
  useState,
  useEffect,
  useLayoutEffect,
  type ReactNode,
  type ErrorInfo,
} from 'react'

// useLayoutEffect fires before browser paint (prevents "Something went wrong" flash).
// Fall back to useEffect on the server where useLayoutEffect is a no-op.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

// PrivyProviderClient is excluded from the server bundle (ssr: false) so that
// @privy-io/react-auth, @privy-io/wagmi, and their browser-only dependencies
// (WalletConnect, Solana WASM, etc.) never execute in Node.js during static
// generation or SSR.
const PrivyContextLayer = dynamic(
  () => import('./PrivyProviderClient').then((m) => ({ default: m.PrivyProviderClient })),
  {
    ssr: false,
    // Show a spinner while the Privy chunk downloads instead of rendering null
    // (null = blank page on mobile where the chunk isn't cached yet).
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    ),
  }
)

// Catches throws from children during the pre-Privy render (mounted=false).
// Privy hooks throw when called without a PrivyProvider context — this boundary
// intercepts that throw and shows a spinner instead of propagating to the root
// ErrorBoundary ("Something went wrong"). Once useLayoutEffect fires and
// mounted becomes true, this boundary is replaced by PrivyContextLayer.
class PrivyBootBoundary extends Component<{ children: ReactNode }, { caught: boolean }> {
  state = { caught: false }

  static getDerivedStateFromError() {
    return { caught: true }
  }

  componentDidCatch(error: Error) {
    console.warn('[PrivyProvider] Pre-init throw caught (Privy not yet ready):', error.message)
  }

  render() {
    if (this.state.caught)
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      )
    return this.props.children
  }
}

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

  useIsomorphicLayoutEffect(() => {
    setMounted(true)
  }, [])

  // Server render + first client render: children without Privy.
  // PrivyBootBoundary catches any throw from Privy hooks (which require a
  // provider context) and shows a spinner instead of "Something went wrong".
  if (!mounted) return <PrivyBootBoundary>{children}</PrivyBootBoundary>

  // PrivyContextLayer shows its own loading spinner (via the `loading` prop)
  // while the chunk downloads — no blank page.
  return (
    <PrivyInitBoundary fallback={<>{children}</>}>
      <PrivyContextLayer>{children}</PrivyContextLayer>
    </PrivyInitBoundary>
  )
}
