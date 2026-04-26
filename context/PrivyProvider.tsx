'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import {
  Component,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
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
    loading: () => <PrivyChunkLoader />,
  }
)

// Shown by PrivyContextLayer while the Privy JS chunk is downloading.
// After 8 s shows a reload button so users aren't stuck on a blank spinner.
function PrivyChunkLoader() {
  const [slow, setSlow] = useState(false)
  const reload = useCallback(() => window.location.reload(), [])

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      <p className="text-sm text-gray-500">{slow ? 'Taking longer than expected…' : 'Loading…'}</p>
      {slow && (
        <button
          onClick={reload}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Reload page
        </button>
      )}
    </div>
  )
}

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
  const pathname = usePathname()
  const isPreviewPage = !!pathname?.startsWith('/preview/')

  useIsomorphicLayoutEffect(() => {
    setMounted(true)
  }, [])

  // On preview pages, warm the Privy chunk in the background (no rendering —
  // just a fetch so the browser caches it). This way the chunk is ready by the
  // time the user taps "Sign in", without risking a crash from rendering Privy
  // SDK cross-origin iframes on a page that doesn't need auth.
  useEffect(() => {
    if (!isPreviewPage) return
    const t = setTimeout(() => {
      import('./PrivyProviderClient').catch(() => {})
    }, 2000)
    return () => clearTimeout(t)
  }, [isPreviewPage])

  // Server render + first client render: children without Privy.
  // PrivyBootBoundary catches any throw from Privy hooks (which require a
  // provider context) and shows a spinner instead of "Something went wrong".
  if (!mounted) return <PrivyBootBoundary>{children}</PrivyBootBoundary>

  // Preview pages are public QR-code landing pages that don't use auth at all.
  // Don't render PrivyContextLayer (no iframes, no Privy SDK init) — the chunk
  // is pre-fetched via useEffect above so login navigation is fast.
  if (isPreviewPage) return <>{children}</>

  // PrivyContextLayer shows its own loading spinner (via the `loading` prop)
  // while the chunk downloads — no blank page.
  return (
    <PrivyInitBoundary fallback={<>{children}</>}>
      <PrivyContextLayer>{children}</PrivyContextLayer>
    </PrivyInitBoundary>
  )
}
