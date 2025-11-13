'use client'

import ErrorBoundary from '../ErrorBoundary'
import Link from 'next/link'
import { ReactNode } from 'react'

interface Web3ErrorBoundaryProps {
  children: ReactNode
}

export default function Web3ErrorBoundary({ children }: Web3ErrorBoundaryProps) {
  const fallback = (
    <div className="flex min-h-[200px] flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-lg border border-orange-200 bg-orange-50 p-6">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-2xl">🔌</span>
          <h3 className="text-lg font-bold text-orange-800">Web3 Connection Error</h3>
        </div>

        <p className="mb-4 text-orange-700">
          There was a problem connecting to your wallet or the blockchain network.
        </p>

        <div className="space-y-2 text-sm text-orange-800">
          <p>
            <strong>Troubleshooting steps:</strong>
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Make sure MetaMask is installed and unlocked</li>
            <li>Check that you're connected to the Celo Alfajores network</li>
            <li>Try refreshing the page</li>
            <li>Disconnect and reconnect your wallet</li>
          </ul>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-orange-600 px-4 py-2 text-sm text-white transition-colors hover:bg-orange-700"
          >
            Refresh Page
          </button>
          <Link
            href="/"
            className="rounded bg-gray-600 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <ErrorBoundary
      fallback={fallback}
      onError={(error, errorInfo) => {
        console.error('Web3 Error:', error)
        console.error('Component Stack:', errorInfo.componentStack)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
