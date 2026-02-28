'use client'

import React, { useState } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useAuth } from '@/context/AuthContext'
import TipModal from './TipModal'

interface TipButtonProps {
  recipientAddress: string
  recipientName?: string
  onTipSent?: (transactionHash: string, amount: number) => void
  className?: string
}

export default function TipButton({
  recipientAddress,
  recipientName,
  onTipSent,
  className = '',
}: TipButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const { address: appKitAddress } = useAppKitAccount()
  const { user } = useAuth()
  const walletAddress = appKitAddress || user?.walletAddress || undefined

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 font-medium text-white shadow-sm transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-md ${className}`}
      >
        Tip PXP
      </button>

      {showModal && (
        <TipModal
          recipientAddress={recipientAddress}
          recipientName={recipientName}
          walletAddress={walletAddress}
          onClose={() => setShowModal(false)}
          onTipSent={(txHash, amount) => {
            onTipSent?.(txHash, amount)
            setShowModal(false)
          }}
        />
      )}
    </>
  )
}
