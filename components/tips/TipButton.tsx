'use client'

import React, { useState } from 'react'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
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
  // Get wallet state at parent level to ensure it's stable when modal opens
  const { address: walletAddress, isConnected } = useAppKitAccount()
  const { open: openAppKit } = useAppKit()

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
          isWalletConnected={isConnected}
          openWalletModal={openAppKit}
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
