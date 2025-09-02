'use client'

import { useWeb3, useWalletConnection, useNetwork, usePermissions } from './WorkingWeb3Provider'
import { formatAddress } from '@/utils/permissions'

interface WalletConnectionProps {
  showFullAddress?: boolean
  showNetworkStatus?: boolean
  showPermissions?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function WalletConnection({
  showFullAddress = false,
  showNetworkStatus = false,
  showPermissions = false,
  size = 'md',
  className = '',
}: WalletConnectionProps = {}) {
  const { connect, disconnect, switchNetwork, requestAccountChange, clearError } = useWeb3()
  const { status, isConnected, walletAddress, error, isLoading } = useWalletConnection()
  const { isOnCorrectNetwork, needsNetworkSwitch } = useNetwork()
  const { isBlogOwner, isAuthorizedCurator, hasAnyPermissions } = usePermissions()

  // Size classes
  const sizeClasses = {
    sm: {
      button: 'px-3 py-1.5 text-sm',
      text: 'text-xs',
      badge: 'text-xs px-2 py-0.5',
    },
    md: {
      button: 'px-4 py-2 text-sm',
      text: 'text-sm',
      badge: 'text-xs px-2 py-1',
    },
    lg: {
      button: 'px-6 py-3 text-base',
      text: 'text-base',
      badge: 'text-sm px-3 py-1.5',
    },
  }

  const sizes = sizeClasses[size]

  const handleConnect = async () => {
    clearError()
    await connect()
  }

  const handleNetworkSwitch = async () => {
    await switchNetwork()
  }

  const handleAccountSwitch = async () => {
    await requestAccountChange()
  }

  const formatDisplayAddress = (address: string) => {
    if (showFullAddress) return address
    return formatAddress(address)
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className={`text-gray-600 ${sizes.text}`}>Connecting...</span>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <button
          onClick={handleConnect}
          className={`rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 ${sizes.button}`}
        >
          Connect Wallet
        </button>
        {error && (
          <div className="flex items-center gap-2">
            <span className={`text-red-600 ${sizes.text}`}>❌ {error}</span>
            <button
              onClick={clearError}
              className={`text-gray-400 hover:text-gray-600 ${sizes.text}`}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Main connection status */}
      <div className="flex items-center gap-3">
        <div className={`text-green-600 ${sizes.text}`}>
          ✅ {formatDisplayAddress(walletAddress!)}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleAccountSwitch}
            className={`text-blue-600 underline hover:text-blue-800 ${sizes.text}`}
            title="Switch MetaMask account"
          >
            Switch
          </button>
          <span className={`text-gray-400 ${sizes.text}`}>|</span>
          <button
            onClick={disconnect}
            className={`text-red-600 underline hover:text-red-800 ${sizes.text}`}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Network status */}
      {(showNetworkStatus || needsNetworkSwitch) && (
        <div className="flex items-center gap-2">
          {needsNetworkSwitch ? (
            <>
              <span className={`text-orange-600 ${sizes.badge} rounded bg-orange-50`}>
                ⚠️ Wrong Network
              </span>
              <button
                onClick={handleNetworkSwitch}
                className={`rounded bg-orange-600 text-white transition-colors hover:bg-orange-700 ${sizes.badge}`}
              >
                Switch to Celo
              </button>
            </>
          ) : (
            <span className={`text-green-600 ${sizes.badge} rounded bg-green-50`}>
              ✅ Celo Alfajores
            </span>
          )}
        </div>
      )}

      {/* Permissions status */}
      {showPermissions && hasAnyPermissions && (
        <div className="flex items-center gap-2">
          {isBlogOwner && (
            <span className={`text-purple-600 ${sizes.badge} rounded bg-purple-50`}>
              👑 Blog Owner
            </span>
          )}
          {isAuthorizedCurator && !isBlogOwner && (
            <span className={`text-blue-600 ${sizes.badge} rounded bg-blue-50`}>🎯 Curator</span>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2">
          <span className={`text-red-600 ${sizes.text}`}>❌ {error}</span>
          <button
            onClick={clearError}
            className={`text-gray-400 hover:text-gray-600 ${sizes.text}`}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
