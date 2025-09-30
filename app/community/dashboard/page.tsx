'use client'

import React, { useState } from 'react'
import QRCodeGenerator, {
  CeloPaymentQRCode,
  generateCeloPaymentURI,
} from '@/components/qr/QRCodeGenerator'

// Mock data for demonstration - in production this would come from Web3 provider
const MOCK_WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b8D0d35c5D35F65b8f'
const MOCK_CAV_TOKEN_ADDRESS = '0xe787A01BafC3276D0B3fEB93159F60dbB99b889F'
const MOCK_CAV_BALANCE = '125.75'

export default function CAVDashboard() {
  const [selectedTab, setSelectedTab] = useState<'receive' | 'pay' | 'share'>('receive')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMemo, setPaymentMemo] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
          <h1 className="mb-2 text-3xl font-bold">CAV Community Dashboard</h1>
          <p className="text-green-100">
            Your hybrid Web3 + QR Code payment hub for Community Asset Vouchers
          </p>
        </div>

        {/* Balance Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CAV Balance</p>
                <p className="text-2xl font-bold text-gray-900">{MOCK_CAV_BALANCE}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                💰
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="text-lg font-medium text-blue-600">Hybrid QR + Web3</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                📱
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Network</p>
                <p className="text-lg font-medium text-purple-600">Celo Alfajores</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                🌐
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Tabs */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'receive', label: 'Receive CAV', icon: '📥' },
                { id: 'pay', label: 'Request Payment', icon: '💸' },
                { id: 'share', label: 'Share Wallet', icon: '🤝' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    selectedTab === tab.id
                      ? 'border-b-2 border-blue-600 bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {selectedTab === 'receive' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Receive CAV Payments</h3>
                  <p className="mb-6 text-gray-600">
                    Share this QR code to receive CAV tokens at your wallet address
                  </p>
                </div>

                <div className="flex justify-center">
                  <CeloPaymentQRCode
                    address={MOCK_WALLET_ADDRESS}
                    tokenAddress={MOCK_CAV_TOKEN_ADDRESS}
                    memo="Payment to CAV Community Member"
                    size={250}
                    showCopyButton={true}
                    allowDownload={true}
                    downloadFilename="my-cav-wallet"
                  />
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-2 font-medium text-blue-900">📱 How to use:</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Share this QR code with anyone who wants to send you CAV</li>
                    <li>• They can scan it with any Celo-compatible wallet</li>
                    <li>• Works with MetaMask, Valora, and other Web3 wallets</li>
                    <li>• No need to type long wallet addresses!</li>
                  </ul>
                </div>
              </div>
            )}

            {selectedTab === 'pay' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Request CAV Payment</h3>
                  <p className="mb-6 text-gray-600">
                    Generate a QR code requesting a specific amount
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Amount (CAV)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="25.00"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Payment Description
                      </label>
                      <input
                        type="text"
                        value={paymentMemo}
                        onChange={(e) => setPaymentMemo(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Coffee payment, venue entry, etc."
                      />
                    </div>

                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <p className="text-sm text-yellow-800">
                        💡 <strong>Pro tip:</strong> Include a clear description so the payer knows
                        what they're paying for!
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    {paymentAmount ? (
                      <CeloPaymentQRCode
                        address={MOCK_WALLET_ADDRESS}
                        amount={paymentAmount}
                        tokenAddress={MOCK_CAV_TOKEN_ADDRESS}
                        memo={paymentMemo || `Payment request for ${paymentAmount} CAV`}
                        size={220}
                        showCopyButton={true}
                        allowDownload={true}
                        downloadFilename={`payment-request-${paymentAmount}-cav`}
                      />
                    ) : (
                      <div className="flex h-220 w-220 items-center justify-center rounded-lg bg-gray-100">
                        <div className="text-center text-gray-500">
                          <div className="mb-2 text-4xl">💰</div>
                          <div className="text-sm">Enter amount to generate QR</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'share' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Share Your Wallet</h3>
                  <p className="mb-6 text-gray-600">
                    Simple QR code containing just your wallet address
                  </p>
                </div>

                <div className="flex justify-center">
                  <QRCodeGenerator
                    data={MOCK_WALLET_ADDRESS}
                    size={250}
                    showCopyButton={true}
                    allowDownload={true}
                    downloadFilename="my-wallet-address"
                    alt="Wallet address QR code"
                  />
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="mb-2 font-medium text-gray-900">Wallet Address:</h4>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 rounded border bg-white px-3 py-2 font-mono text-sm">
                      {MOCK_WALLET_ADDRESS}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(MOCK_WALLET_ADDRESS)}
                      className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <h4 className="mb-2 font-medium text-green-900">🌐 Universal compatibility:</h4>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• Works with any blockchain wallet or service</li>
                    <li>• Can be used for any Celo token, not just CAV</li>
                    <li>• Perfect for sharing in social media or messaging apps</li>
                    <li>• No payment amount specified - flexible for any transaction</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Development Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 rounded-lg bg-gray-100 p-4">
            <h4 className="mb-2 font-medium text-gray-900">🛠️ Development Info</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <strong>CAV Token:</strong> {MOCK_CAV_TOKEN_ADDRESS}
              </p>
              <p>
                <strong>Wallet:</strong> {MOCK_WALLET_ADDRESS}
              </p>
              <p>
                <strong>QR Code Library:</strong> qrcode@1.5.4
              </p>
              <p>
                <strong>URI Standard:</strong> Celo payment protocol (EIP-681 inspired)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
