'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import {
  Component,
  useState,
  useEffect,
  useLayoutEffect,
  type ReactNode,
  type ErrorInfo,
} from 'react'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function LoadingSpinner() {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 6000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      <p className="text-sm text-gray-500">Connecting to sign-in service…</p>
      {timedOut && (
        <div className="mt-2 max-w-xs rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center">
          <p className="mb-2 text-xs text-amber-800">
            Taking too long? This may not work inside a QR scanner or app browser.
          </p>
          <a
            href={typeof window !== 'undefined' ? window.location.href : '/'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Open in your browser →
          </a>
        </div>
      )}
    </div>
  )
}

// PrivyProviderClient is excluded from the server bundle via ssr:false.
// The loading prop shows a spinner for the brief moment before the cached
// chunk resolves (privyChunkReady is only set true after the import resolves,
// so the loading prop shows for at most one async tick in practice).
const PrivyContextLayer = dynamic(
  () => import('./PrivyProviderClient').then((m) => ({ default: m.PrivyProviderClient })),
  { ssr: false, loading: () => <LoadingSpinner /> }
)

// Catches throws from Privy hooks called without a PrivyProvider in the tree.
// While the Privy chunk downloads the hooks throw; this boundary catches them
// and shows a spinner instead of crashing to "Something went wrong".
class PrivyBootBoundary extends Component<{ children: ReactNode }, { caught: boolean }> {
  state = { caught: false }

  static getDerivedStateFromError() {
    return { caught: true }
  }

  componentDidCatch(error: Error) {
    console.warn('[PrivyProvider] Pre-init throw caught (Privy not yet ready):', error.message)
  }

  render() {
    if (this.state.caught) return <LoadingSpinner />
    return this.props.children
  }
}

// Catches errors from PrivyProvider / WagmiProvider initialization.
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
      '[PrivyProvider] Privy/Wagmi initialization threw — auth will be unavailable:',
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
  const pathname = usePathname()
  const isPreviewPage = !!pathname?.startsWith('/preview/')

  useIsomorphicLayoutEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isPreviewPage) return

    // Download the Privy chunk on auth/community pages. Children render inside
    // PrivyBootBoundary (which catches hook throws) while this downloads.
    // When done, privyChunkReady flips → PrivyContextLayer renders with the
    // chunk already cached so its loading prop resolves instantly.
    // No pre-warm on preview pages: downloading Privy while the preview is
    // still in memory causes OOM on low-RAM Android devices ("Aw, Snap!").
    let cancelled = false
    import('./PrivyProviderClient')
      .then(() => {
        if (!cancelled) setPrivyChunkReady(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [mounted, isPreviewPage])

  if (!mounted) return <PrivyBootBoundary>{children}</PrivyBootBoundary>

  // Preview pages have no Privy hooks — render bare, no download triggered.
  if (isPreviewPage) return <>{children}</>

  // Chunk still downloading: PrivyBootBoundary catches hook throws and shows
  // the spinner instead of propagating to the root ErrorBoundary.
  if (!privyChunkReady) return <PrivyBootBoundary>{children}</PrivyBootBoundary>

  return (
    <PrivyInitBoundary fallback={<>{children}</>}>
      <PrivyContextLayer>{children}</PrivyContextLayer>
    </PrivyInitBoundary>
  )
}
