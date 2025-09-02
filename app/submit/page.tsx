'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useWalletConnection, useNetwork } from '@/components/web3/WorkingWeb3Provider'
import WalletConnection from '@/components/web3/WalletConnection'
import { DebugInfo } from '@/components/web3/DebugInfo'

interface VenueFormData {
  name: string
  city: string
  contactInfo: string
  hasPiano: boolean
  hasJamSession: boolean
  venueType: number
  description: string
  address: string
}

const VENUE_TYPES = ['Cafe', 'Restaurant', 'Bar', 'Club', 'Community Center']

export default function SubmitVenue() {
  const {
    isConnected,
    walletAddress,
    submitVenue,
    getVenueCount,
    isOnCorrectNetwork,
    ensureConnection,
  } = useWallet()

  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    city: 'Toronto',
    contactInfo: '',
    hasPiano: true,
    hasJamSession: false,
    venueType: 0,
    description: '',
    address: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<string>('')
  const [venueCount, setVenueCount] = useState<number>(0)
  const [error, setError] = useState<string>('')

  // Fetch current venue count
  const fetchVenueCount = async () => {
    try {
      const result = await getVenueCount()
      if (result.success && result.count !== undefined) {
        setVenueCount(result.count)
      }
    } catch (error) {
      console.error('Error fetching venue count:', error)
    }
  }

  // Submit venue function
  const handleSubmitVenue = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      setError('Please connect your wallet first')
      return
    }

    if (!isOnCorrectNetwork) {
      setError('Please switch to Celo Alfajores network')
      return
    }

    // Validate required fields
    if (!formData.name || !formData.city || !formData.contactInfo) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('Submitting venue...')
    setError('')

    try {
      // Ensure wallet connection and network
      const connected = await ensureConnection()
      if (!connected) {
        setError('Failed to ensure wallet connection')
        return
      }

      console.log('🚀 About to submit venue:', {
        name: formData.name,
        city: formData.city,
        contactInfo: formData.contactInfo,
        hasPiano: formData.hasPiano,
        walletAddress
      })

      const result = await submitVenue(
        {
          name: formData.name,
          city: formData.city,
          contactInfo: formData.contactInfo,
          hasPiano: formData.hasPiano,
          // Note: other fields are UI-only, not sent to contract
          description: formData.description,
          address: formData.address,
        },
        {
          onTransactionHash: (hash) => {
            setSubmitStatus(`Transaction submitted! Hash: ${hash}`)
            console.log('✅ Transaction hash received:', hash)
          },
        }
      )

      if (result.success) {
        setSubmitStatus(`✅ Venue submitted successfully! Transaction: ${result.transactionHash}`)

        // Reset form
        setFormData({
          name: '',
          city: 'Toronto',
          contactInfo: '',
          hasPiano: true,
          hasJamSession: false,
          venueType: 0,
          description: '',
          address: '',
        })

        // Update venue count after delay
        setTimeout(fetchVenueCount, 3000)
      } else {
        console.error('❌ Venue submission failed:', result.error)
        setError(result.error || 'Failed to submit venue')
        setSubmitStatus('')
      }
    } catch (error: any) {
      console.error('💥 Exception during venue submission:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data
      })
      setError(`Failed to submit venue: ${error.message}`)
      setSubmitStatus('')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load venue count on component mount
  useEffect(() => {
    fetchVenueCount()
  }, [])

  // Clear messages after delay
  useEffect(() => {
    if (submitStatus.includes('✅')) {
      const timer = setTimeout(() => setSubmitStatus(''), 10000)
      return () => clearTimeout(timer)
    }
  }, [submitStatus])

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <DebugInfo />
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">🎹 Submit a Piano Venue</h1>
          <p className="text-gray-600">
            Found a venue with a piano? Help build our community by submitting it for verification.
          </p>
          <p className="mt-2 text-sm text-blue-600">
            Current venues in database: {venueCount} | Reward: Verification by curator
          </p>
        </div>

        {/* Wallet Connection Section */}
        <div className="mb-8 rounded-lg bg-blue-50 p-4">
          {!isConnected ? (
            <div>
              <p className="mb-3 text-blue-800">
                Connect your wallet to submit venues to the blockchain
              </p>
              <WalletConnection size="md" showNetworkStatus={true} />
            </div>
          ) : (
            <div>
              <p className="mb-2 text-green-800">✅ Wallet Connected & Ready to Submit</p>
              <WalletConnection showFullAddress={false} showNetworkStatus={true} size="sm" />
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-red-800">❌ {error}</div>
            <button
              onClick={() => setError('')}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Success Display */}
        {submitStatus && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              submitStatus.includes('✅')
                ? 'border border-green-200 bg-green-50 text-green-800'
                : 'border border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            {submitStatus}
          </div>
        )}

        {/* Venue Submission Form */}
        <form onSubmit={handleSubmitVenue} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Venue Name *</label>
              <input
                type="text"
                required
                maxLength={64}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Jazz Cafe Toronto"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">City *</label>
              <input
                type="text"
                required
                maxLength={32}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Toronto"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Full Address (Optional)
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="456 Queen Street West, Toronto, ON"
            />
          </div>

          {/* Contact Info */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Contact Information *
            </label>
            <input
              type="text"
              required
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="info@venue.com or (416) 555-0123 or www.venue.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              Email, phone number, or website for the venue
            </p>
          </div>

          {/* Venue Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Venue Type</label>
            <select
              value={formData.venueType}
              onChange={(e) => setFormData({ ...formData, venueType: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {VENUE_TYPES.map((type, index) => (
                <option key={index} value={index}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Piano & Features */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.hasPiano}
                onChange={(e) => setFormData({ ...formData, hasPiano: e.target.checked })}
                className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Has Piano Available for Use
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.hasJamSession}
                onChange={(e) => setFormData({ ...formData, hasJamSession: e.target.checked })}
                className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Hosts Regular Jam Sessions
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description / Additional Notes (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about this venue, the piano quality, atmosphere, special events, etc..."
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={!isConnected || isSubmitting || !isOnCorrectNetwork}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Submitting to Blockchain...
                </span>
              ) : (
                'Submit Venue for Verification'
              )}
            </button>

            {!isConnected && (
              <p className="mt-2 text-center text-sm text-gray-500">
                Please connect your wallet to submit
              </p>
            )}

            {isConnected && !isOnCorrectNetwork && (
              <p className="mt-2 text-center text-sm text-orange-600">
                Please switch to Celo Alfajores network
              </p>
            )}
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 rounded-lg bg-yellow-50 p-4">
          <h3 className="mb-2 font-medium text-yellow-800">How it works:</h3>
          <ol className="space-y-1 text-sm text-yellow-700">
            <li>1. Fill out the venue details in the form above</li>
            <li>2. Connect your wallet and submit to the blockchain</li>
            <li>3. A curator will visit and verify the venue information</li>
            <li>4. Once approved, the venue becomes searchable by the community</li>
            <li>5. Help build the largest database of piano-friendly venues!</li>
          </ol>

          <div className="mt-3 text-xs text-yellow-600">
            <p>
              <strong>Gas Fees:</strong> Submitting requires a small transaction fee on Celo
              (~$0.001)
            </p>
            <p>
              <strong>Verification:</strong> All submissions are manually verified before appearing
              in search
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
