'use client'

import { useWeb3 } from './WorkingWeb3Provider'

export function DebugInfo() {
  const {
    status,
    walletAddress,
    chainId,
    networkStatus,
    isOnCorrectNetwork,
    error,
    isBlogOwner,
    isAuthorizedCurator
  } = useWeb3()

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs font-mono max-w-sm z-50">
      <h3 className="font-bold text-yellow-400 mb-2">🔧 Debug Info</h3>
      <div className="space-y-1">
        <div><strong>Status:</strong> {status}</div>
        <div><strong>Address:</strong> {walletAddress || 'Not connected'}</div>
        <div><strong>Chain ID:</strong> {chainId || 'Unknown'}</div>
        <div><strong>Network:</strong> {networkStatus}</div>
        <div><strong>Correct Net:</strong> {isOnCorrectNetwork ? '✅' : '❌'}</div>
        <div><strong>Blog Owner:</strong> {isBlogOwner ? '✅' : '❌'}</div>
        <div><strong>Curator:</strong> {isAuthorizedCurator ? '✅' : '❌'}</div>
        {error && <div className="text-red-400"><strong>Error:</strong> {error}</div>}
      </div>
      <div className="mt-2 text-gray-400">
        <div><strong>Expected Chain:</strong> 0xaef3 (44787)</div>
        <div><strong>Contract:</strong> {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.slice(0, 6)}...{process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.slice(-4)}</div>
        <div><strong>Blog Owner:</strong> {process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.slice(0, 6)}...{process.env.NEXT_PUBLIC_BLOG_OWNER_ADDRESS?.slice(-6)}</div>
      </div>
    </div>
  )
}