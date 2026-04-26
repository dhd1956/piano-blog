'use client'

import { usePathname } from 'next/navigation'
import {
  Component,
  ComponentType,
  useState,
  useEffect,
  useLayoutEffect,
  type ReactNode,
  type ErrorInfo,
} from 'react'

// useLayoutEffect fires before browser paint (prevents flash).
// Fall back to useEffect on the server where useLayoutEffect is a no-op.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

// Catches throws from children during the pre-Privy render (mounted=false).
class PrivyBootBoundary extends Component<{ children: ReactNode }, { caught: boolean }> {
  state = { caught: false }

  static getDerivedStateFromError() {
    return { caught: true }
  }

  componentDidCatch(error: Error) {
    console.warn('[PrivyProvider] Pre-init throw caught:', error.message)
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
  // Holds the PrivyProviderClient component once its chunk has downloaded.
  const [PrivyClient, setPrivyClient] = useState<ComponentType<{ children: ReactNode }> | null>(
    null
  )
  const pathname = usePathname()
  const isPreviewPage = !!pathname?.startsWith('/preview/')

  useIsomorphicLayoutEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (isPreviewPage) {
      // Preview pages don't need Privy rendered. Warm the chunk cache silently
      // after 2 s so it's ready by the time the user taps "Sign in".
      const t = setTimeout(() => {
        import('./PrivyProviderClient').catch(() => {})
      }, 2000)
      return () => clearTimeout(t)
    }

    // Auth pages: start downloading the Privy chunk immediately.
    // Children render right away with usePrivy() returning { ready: false }
    // defaults. When the chunk loads, PrivyClient is set and children remount
    // inside PrivyProvider — ready becomes true and buttons enable.
    let cancelled = false
    import('./PrivyProviderClient')
      .then((m) => {
        if (!cancelled) setPrivyClient(() => m.PrivyProviderClient)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [mounted, isPreviewPage])

  // Server render + first client render: children without Privy.
  if (!mounted) return <PrivyBootBoundary>{children}</PrivyBootBoundary>

  // Preview pages and pages where the chunk hasn't loaded yet: render children
  // without Privy context. usePrivy() returns { ready: false } — LoginContent
  // shows the form with "Connecting…" disabled buttons rather than a blank spinner.
  if (isPreviewPage || !PrivyClient) return <>{children}</>

  return (
    <PrivyInitBoundary fallback={<>{children}</>}>
      <PrivyClient>{children}</PrivyClient>
    </PrivyInitBoundary>
  )
}
