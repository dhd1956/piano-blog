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

// PrivyProviderClient is excluded from the server bundle via ssr:false.
// No `loading` prop here — we pre-warm the chunk via useEffect below so that
// by the time this dynamic component renders, the chunk is already cached and
// PrivyContextLayer resolves instantly (no spinner blocking children).
const PrivyContextLayer = dynamic(
  () => import('./PrivyProviderClient').then((m) => ({ default: m.PrivyProviderClient })),
  { ssr: false }
)

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
  // True once the Privy chunk has been downloaded into the browser cache.
  // We flip this via a manual import() so that when PrivyContextLayer renders
  // (via next/dynamic) it resolves instantly — no loading state, no spinner.
  const [privyChunkReady, setPrivyChunkReady] = useState(false)
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

    // Auth/community pages: download the chunk immediately so PrivyContextLayer
    // can render without a loading spinner. Children render at once with
    // usePrivy() returning { ready: false } defaults ("Connecting…" state in
    // LoginContent). When the chunk resolves, privyChunkReady flips and
    // PrivyContextLayer renders — children remount inside PrivyProvider and
    // ready becomes true.
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

  // Server render + first client render: children without Privy.
  if (!mounted) return <PrivyBootBoundary>{children}</PrivyBootBoundary>

  // Preview pages and pages where the chunk hasn't downloaded yet: render
  // children without Privy context. usePrivy() returns { ready: false } so
  // LoginContent shows the form with "Connecting…" disabled buttons.
  if (isPreviewPage || !privyChunkReady) return <>{children}</>

  // Chunk is in cache — PrivyContextLayer (next/dynamic) resolves instantly.
  return (
    <PrivyInitBoundary fallback={<>{children}</>}>
      <PrivyContextLayer>{children}</PrivyContextLayer>
    </PrivyInitBoundary>
  )
}
