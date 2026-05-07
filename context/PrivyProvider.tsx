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
// Privy chunk has loaded. When false they skip rendering hook-dependent children.
export const PrivyChunkReadyContext = createContext(false)

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
  // Using state instead of dynamic() avoids the dynamic() loading-prop spinner.
  const [PrivyClient, setPrivyClient] = useState<ComponentType<{ children: ReactNode }> | null>(
    null
  )
  const pathname = usePathname()
  const isPreviewPage = !!pathname?.startsWith('/preview/')
  // Pages that don't use any Privy hooks. We still download the chunk on
  // these pages (so it's cached when the user navigates elsewhere), but we
  // don't render PrivyProvider — which prevents Privy's internal
  // authenticated-state effects from firing and triggering a circular-dep TDZ.
  const isPrivyFree = !!pathname?.startsWith('/events/')

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
        if (!cancelled) setPrivyClient(() => m.PrivyProviderClient)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [mounted, isPreviewPage])

  // PrivyChunkReadyContext=true only when Privy is downloaded AND rendered.
  // On isPrivyFree pages the chunk may be downloaded but we don't render the
  // provider, so hooks like usePrivy() are not available — keep it false there.
  const privyReady = mounted && !!PrivyClient && !isPrivyFree

  let content: ReactNode

  if (!PrivyClient || isPrivyFree) {
    // Server render, client before chunk loads, or a page that doesn't need
    // Privy. Render children bare so Privy effects never fire here.
    content = <>{children}</>
  } else {
    // Chunk downloaded and this page uses Privy. Wrap children.
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
