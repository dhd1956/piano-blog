'use client'

import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react'
import { useState, useEffect, useRef } from 'react'
import Link from './Link'

export default function ConnectButton() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const [isOpen, setIsOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string>('')
  const [profileUrl, setProfileUrl] = useState<string>('/profile')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set display name and profile URL based on wallet address
    if (isConnected && address) {
      // Format wallet address (0x1234...5678)
      const formatted = `${address.slice(0, 6)}...${address.slice(-4)}`
      setDisplayName(formatted)
      setProfileUrl(`/profile/${address}`)
    }
  }, [isConnected, address])

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDisconnect = () => {
    disconnect()
    setIsOpen(false)
  }

  // Show "Connect" button if not connected
  if (!isConnected) {
    return (
      <button
        onClick={() => open()}
        className="hover:text-primary-500 dark:hover:text-primary-400 font-medium text-gray-900 dark:text-gray-100"
      >
        Connect
      </button>
    )
  }

  // Show user menu if connected
  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:text-primary-500 dark:hover:text-primary-400 flex items-center gap-1 font-medium text-gray-900 dark:text-gray-100"
        aria-label="User menu"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-[100] mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {displayName}
            </p>
          </div>

          <Link
            href={profileUrl}
            className="hover:bg-primary-50 dark:hover:bg-primary-900/20 block px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
            onClick={() => setIsOpen(false)}
          >
            My Profile
          </Link>

          <button
            onClick={handleDisconnect}
            className="hover:bg-primary-50 dark:hover:bg-primary-900/20 block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
