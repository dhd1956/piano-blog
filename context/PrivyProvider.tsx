'use client'

import { usePathname } from 'next/navigation'
import {
  Component,
  createContext,
  useState,
  useEffect,
  useLayoutEffect,
  type ComponentType,
  type ReactNode,
  type ErrorInfo,
} from 'react'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

// Pages that call Privy hooks (e.g. login page) read this to know whether the
// Privy chunk has loaded. When false they skip rendering hook-dependent children,
// preventing the throw that would cause PrivyBootBoundary to blank the page.
export const PrivyChunkReadyContext = createContext(false)

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

// Safety net: catches stray Privy hook throws from pages other than the login
// page (which uses PrivyChunkReadyContext to avoid rendering hooks too early).
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
  // Store the PrivyProviderClient component class after the chunk downloads.
  // Using state instead of dynamic() avoids the dynamic() loading-prop spinner:
  // dynamic() shows its fallback even when the module is already in the ESM cache,
  // because it has its own async resolution path. Storing the class in state and
  // rendering it directly bypasses that entirely — no spinner, instant transition.
  const [PrivyClient, setPrivyClient] = useState<ComponentType<{ children: ReactNode }> | null>(
    null
  )
  const pathname = usePathname()
  const isPreviewPage = !!pathname?.startsWith('/preview/')

  useIsomorphicLayoutEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isPreviewPage) return

    // Download on non-preview pages only. No pre-warm on preview pages:
    // downloading Privy while the preview is in memory causes OOM crashes
    // ("Aw, Snap!") on low-RAM Android devices.
    let cancelled = false
    import('./PrivyProviderClient')
      .then((m) => {
        // Functional setState: prevents React from treating the component
        // as an updater function (setState(fn) calls fn(prevState)).
        if (!cancelled) setPrivyClient(() => m.PrivyProviderClient)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [mounted, isPreviewPage])

  const privyReady = mounted && !!PrivyClient

  let content: ReactNode

  if (!mounted || (!isPreviewPage && !PrivyClient)) {
    // Server render, or client before the Privy chunk has loaded.
    // PrivyBootBoundary catches any stray hook throws from non-login pages.
    // The login page avoids throwing entirely by reading PrivyChunkReadyContext.
    content = isPreviewPage ? <>{children}</> : <PrivyBootBoundary>{children}</PrivyBootBoundary>
  } else if (isPreviewPage) {
    // Preview/flash pages have no Privy hooks — render bare, no download triggered.
    content = <>{children}</>
  } else {
    // Chunk downloaded and evaluated. Render PrivyProviderClient directly so
    // there is zero loading phase — children see Privy context immediately.
    const PC = PrivyClient as ComponentType<{ children: ReactNode }>
    content = (
      <PrivyInitBoundary fallback={<>{children}</>}>
        <PC>{children}</PC>
      </PrivyInitBoundary>
    )
  }

  return (
    <PrivyChunkReadyContext.Provider value={privyReady}>{content}</PrivyChunkReadyContext.Provider>
  )
}
