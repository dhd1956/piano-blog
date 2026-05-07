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

  const privyReady = mounted && !!PrivyClient

  let content: ReactNode

  if (!PrivyClient) {
    // Server render, or client before the Privy chunk has loaded.
    // Render children bare — PrivyChunkReadyContext=false gates any Privy
    // hook usage in child components (e.g. login page skips LoginContent).
    content = <>{children}</>
  } else {
    // Chunk downloaded. Render PrivyProviderClient directly so children see
    // Privy context immediately with no loading phase.
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
