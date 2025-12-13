'use client'

import { useState, useEffect } from 'react'
import { useHybridWallet } from '@/hooks/useHybridWallet'

interface VenueFormData {
  name: string
  city: string
  email: string
  phone: string
  website: string
  hasPiano: boolean
  hasJamSession: boolean
  venueType: number
  description: string
  address: string
}

const VENUE_TYPES = [
  'Cafe',
  'Restaurant',
  'Bar',
  'Club',
  'Community Center',
  'Hotel/Resort',
  'Music School',
  'Church/Religious',
  'Library',
  'Senior Centre',
  'Retirement Home',
  'Other',
]

export default function SubmitVenue() {
  const { isConnected, walletAddress, connectWallet, disconnectWallet } = useHybridWallet()

  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    city: '',
    email: '',
    phone: '',
    website: '',
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
  const [emailError, setEmailError] = useState<string>('')
  const [phoneError, setPhoneError] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    city?: string
    address?: string
  }>({})
  const [isLookingUpAddress, setIsLookingUpAddress] = useState(false)
  const [showAddressTooltip, setShowAddressTooltip] = useState(false)

  // Fetch current venue count from PostgreSQL API
  const fetchVenueCount = async () => {
    try {
      const response = await fetch('/api/venues', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const result = await response.json()
        setVenueCount(result.venues?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching venue count:', error)
    }
  }

  /**
   * Auto-fill address using Gemini AI
   */
  const handleLookupAddress = async () => {
    if (!formData.name.trim()) {
      setFieldErrors((prev) => ({ ...prev, name: 'Please enter venue name first' }))
      return
    }

    if (!formData.city.trim()) {
      setFieldErrors((prev) => ({ ...prev, city: 'Please enter city first' }))
      return
    }

    setIsLookingUpAddress(true)
    setError('')

    try {
      const response = await fetch('/api/venues/lookup-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueName: formData.name,
          city: formData.city,
        }),
      })

      const data = await response.json()

      if (data.success && data.address) {
        // Update address and any available contact info
        setFormData((prev) => ({
          ...prev,
          address: data.address,
          ...(data.phone && { phone: data.phone }),
          ...(data.website && { website: data.website }),
          ...(data.email && { email: data.email }),
        }))
        setFieldErrors((prev) => ({
          ...prev,
          address: undefined,
          ...(data.phone && { phone: undefined }),
          ...(data.website && { website: undefined }),
          ...(data.email && { email: undefined }),
        }))

        // Show success message with what was populated
        const populated = ['address']
        if (data.phone) populated.push('phone')
        if (data.website) populated.push('website')
        if (data.email) populated.push('email')
        console.log(`✅ Auto-filled: ${populated.join(', ')}`)
      } else {
        setError(data.error || 'Could not find address. Please enter manually.')
      }
    } catch (err: any) {
      console.error('Error looking up address:', err)
      setError('Failed to lookup address. Please enter manually.')
    } finally {
      setIsLookingUpAddress(false)
    }
  }

  /**
   * Handle Enter key press in address field
   */
  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLookupAddress()
    }
  }

  // Submit venue function using PostgreSQL API
  const handleSubmitVenue = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setFieldErrors({})
    setEmailError('')
    setPhoneError('')
    setError('')

    // Re-check wallet connection status before submitting
    let currentWalletAddress = walletAddress
    if (isConnected && typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length === 0) {
          // Wallet was disconnected but React state hasn't updated yet
          console.log('Wallet disconnected - submitting as anonymous')
          currentWalletAddress = null
        } else {
          currentWalletAddress = accounts[0]
        }
      } catch (error) {
        console.error('Error checking wallet:', error)
        currentWalletAddress = null
      }
    } else {
      currentWalletAddress = null
    }

    // Validate required fields with specific error messages
    const errors: { name?: string; city?: string; address?: string } = {}

    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Venue name is required'
    }
    if (!formData.city || !formData.city.trim()) {
      errors.city = 'City is required'
    }
    if (!formData.address || !formData.address.trim()) {
      errors.address = 'Full address is required'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('❌ Please fill in all required fields (marked with *)')
      // Scroll to first error field
      const firstErrorField = Object.keys(errors)[0]
      document
        .getElementById(`${firstErrorField}-field`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Validate at least one contact method
    if (!formData.email && !formData.phone && !formData.website) {
      setError('Please provide at least one contact method (email, phone, or website)')
      return
    }

    // Validate email format if provided
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        setEmailError(
          'Invalid email format. Please enter a valid email address (e.g., info@venue.com)'
        )
        setError('❌ Email validation failed: Please check the email address format')
        // Scroll to email field
        document
          .getElementById('email-field')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }

    // Clear email error if validation passes
    setEmailError('')

    // Validate phone number if provided (international: 7-15 digits)
    if (formData.phone) {
      const digits = formData.phone.replace(/\D/g, '')
      if (digits.length > 0 && (digits.length < 7 || digits.length > 15)) {
        setPhoneError('Please enter a valid phone number (7-15 digits)')
        setError('❌ Phone validation failed: Phone number must be between 7 and 15 digits')
        document
          .getElementById('phone-field')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }

    // Clear phone error if validation passes
    setPhoneError('')

    // Auto-add https:// to website if missing protocol
    let websiteUrl = formData.website.trim()
    if (websiteUrl && !websiteUrl.match(/^https?:\/\//i)) {
      websiteUrl = `https://${websiteUrl}`
    }

    setIsSubmitting(true)
    setSubmitStatus('Submitting venue...')
    setError('')

    try {
      console.log('🚀 About to submit venue:', {
        name: formData.name,
        city: formData.city,
        email: formData.email,
        phone: formData.phone,
        website: websiteUrl,
        hasPiano: formData.hasPiano,
        submittedBy: currentWalletAddress || 'anonymous',
      })

      // Submit to PostgreSQL API
      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          city: formData.city,
          contactInfo: formData.email || formData.phone || websiteUrl || '',
          email: formData.email,
          phone: formData.phone,
          website: websiteUrl,
          hasPiano: formData.hasPiano,
          hasJamSession: formData.hasJamSession,
          venueType: formData.venueType,
          description: formData.description,
          fullAddress: formData.address,
          submittedBy: currentWalletAddress || 'anonymous',
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setSubmitStatus(`✅ Venue submitted successfully! ID: ${result.venue?.id}`)
        console.log('✅ Venue submitted to database:', result.venue)

        // Scroll to success message
        setTimeout(() => {
          document
            .getElementById('success-message')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)

        // Reset form
        setFormData({
          name: '',
          city: '',
          email: '',
          phone: '',
          website: '',
          hasPiano: true,
          hasJamSession: false,
          venueType: 0,
          description: '',
          address: '',
        })

        // Update venue count
        fetchVenueCount()
      } else {
        const errorResult = await response.json()
        console.error('❌ Venue submission failed:', errorResult)

        // Handle duplicate venue errors with helpful messages
        if (errorResult.errorCode === 'DUPLICATE_VENUE') {
          if (errorResult.existingVenueId) {
            setError(
              `${errorResult.error || 'Duplicate venue detected.'} View the existing venue at /venueDetails/${errorResult.existingVenueId}`
            )
          } else {
            setError(errorResult.error || 'A venue with this name already exists in this city.')
          }
        } else if (errorResult.errorCode === 'DUPLICATE_VENUE_HASH') {
          if (errorResult.existingVenueId) {
            setError(
              `${errorResult.error || 'You have already submitted this venue.'} View it at /venueDetails/${errorResult.existingVenueId}`
            )
          } else {
            setError(
              errorResult.error || 'This venue has already been submitted with your wallet address.'
            )
          }
        } else if (errorResult.errorCode === 'DUPLICATE_SLUG') {
          setError(
            errorResult.error ||
              'A venue with a very similar name already exists. Please try adding more details to make it unique (e.g., street name, neighborhood).'
          )
        } else {
          // Generic error
          setError(errorResult.error || 'Failed to submit venue. Please try again.')
        }

        setSubmitStatus('')
      }
    } catch (error: any) {
      console.error('💥 Exception during venue submission:', error)
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
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">🎹 Submit a Piano Venue</h1>
          <p className="text-gray-600">
            Found a venue with a piano? Help build our community by submitting it for verification.
          </p>
          <p className="mt-2 text-sm text-blue-600">
            Current venues in database: {venueCount} | Reward: Community recognition
          </p>
        </div>

        {/* Optional Wallet Connection Section */}
        <div className="mb-8 rounded-lg bg-blue-50 p-4">
          {!isConnected ? (
            <div>
              <p className="mb-3 text-blue-800">
                Optionally connect your wallet to get credit for submissions
              </p>
              <button
                onClick={connectWallet}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Connect Wallet (Optional)
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-green-800">
                ✅ Wallet Connected - You'll get credit for this submission
              </p>
              <p className="mb-3 text-sm text-gray-600">
                Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </p>
              <button
                onClick={disconnectWallet}
                className="rounded-lg bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700"
              >
                Disconnect Wallet
              </button>
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
            id="success-message"
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
            <div id="name-field">
              <label className="mb-2 block text-sm font-medium text-gray-700">Venue Name *</label>
              <input
                type="text"
                maxLength={64}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined })
                }}
                className={`w-full rounded-lg border px-3 py-2 text-base text-gray-900 focus:ring-2 ${
                  fieldErrors.name
                    ? 'border-red-500 bg-red-50 focus:ring-red-500'
                    : 'border-gray-300 bg-white focus:ring-blue-500'
                }`}
                placeholder="e.g., Jazz Cafe Toronto"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm font-medium text-red-600">⚠️ {fieldErrors.name}</p>
              )}
            </div>

            <div id="city-field">
              <label className="mb-2 block text-sm font-medium text-gray-700">City *</label>
              <input
                type="text"
                maxLength={32}
                value={formData.city}
                onChange={(e) => {
                  setFormData({ ...formData, city: e.target.value })
                  if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: undefined })
                }}
                className={`w-full rounded-lg border px-3 py-2 text-base text-gray-900 focus:ring-2 ${
                  fieldErrors.city
                    ? 'border-red-500 bg-red-50 focus:ring-red-500'
                    : 'border-gray-300 bg-white focus:ring-blue-500'
                }`}
                placeholder="e.g., Toronto"
              />
              {fieldErrors.city && (
                <p className="mt-1 text-sm font-medium text-red-600">⚠️ {fieldErrors.city}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div id="address-field">
            <label className="mb-2 block text-sm font-medium text-gray-700">Full Address *</label>
            <div className="relative">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value })
                  if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: undefined })
                }}
                onKeyDown={handleAddressKeyDown}
                onFocus={() => setShowAddressTooltip(true)}
                onBlur={() => setTimeout(() => setShowAddressTooltip(false), 200)}
                className={`w-full rounded-lg border px-3 py-2 pr-12 text-base text-gray-900 focus:ring-2 ${
                  fieldErrors.address
                    ? 'border-red-500 bg-red-50 focus:ring-red-500'
                    : 'border-gray-300 bg-white focus:ring-blue-500'
                }`}
                placeholder="Type address or press Enter to auto-fill"
              />
              <button
                type="button"
                onClick={handleLookupAddress}
                disabled={isLookingUpAddress || !formData.name || !formData.city}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 py-1 text-xl transition-all hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40"
                title={
                  !formData.name || !formData.city
                    ? 'Enter venue name and city first'
                    : 'Click or press Enter to auto-fill address using AI'
                }
              >
                {isLookingUpAddress ? (
                  <span className="inline-block animate-spin">⏳</span>
                ) : (
                  <>🤖</>
                )}
              </button>
              {showAddressTooltip && formData.name && formData.city && !formData.address && (
                <div className="absolute top-full left-0 z-10 mt-1 rounded-md bg-gray-800 px-3 py-2 text-xs text-white shadow-lg">
                  Press <kbd className="rounded bg-gray-700 px-1">Enter</kbd> or click 🤖 to
                  auto-fill
                </div>
              )}
            </div>
            {fieldErrors.address && (
              <p className="mt-1 text-sm font-medium text-red-600">⚠️ {fieldErrors.address}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              💡 Fill in venue name and city above, then press Enter or click 🤖 to auto-fill
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Venue Contact Information (provide at least one)
            </h3>
            <p className="text-xs text-gray-600">
              How can people contact this venue? Provide the venue's public contact details.
            </p>

            {/* Email */}
            <div id="email-field">
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="text"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  // Clear email error when user types
                  if (emailError) setEmailError('')
                }}
                className={`w-full rounded-lg border px-3 py-2 text-base text-gray-900 focus:ring-2 ${
                  emailError
                    ? 'border-red-500 bg-red-50 focus:ring-red-500'
                    : 'border-gray-300 bg-white focus:ring-blue-500'
                }`}
                placeholder="info@venue.com"
              />
              {emailError && (
                <p className="mt-1 text-sm font-medium text-red-600">⚠️ {emailError}</p>
              )}
              {!emailError && (
                <p className="mt-1 text-xs text-gray-500">
                  Must be a valid email format (e.g., name@domain.com)
                </p>
              )}
            </div>

            {/* Phone */}
            <div id="phone-field">
              <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  // Allow digits, spaces, dashes, parentheses, and plus sign for international numbers
                  const cleaned = e.target.value.replace(/[^\d\s\-()+ ]/g, '')
                  setFormData({ ...formData, phone: cleaned })
                  // Clear phone error when user types
                  if (phoneError) setPhoneError('')
                }}
                className={`w-full rounded-lg border px-3 py-2 text-base text-gray-900 focus:ring-2 ${
                  phoneError
                    ? 'border-red-500 bg-red-50 focus:ring-red-500'
                    : 'border-gray-300 bg-white focus:ring-blue-500'
                }`}
                placeholder="+1 416 555 0123 or (416) 555-0123"
                maxLength={20}
              />
              {phoneError && (
                <p className="mt-1 text-sm font-medium text-red-600">⚠️ {phoneError}</p>
              )}
              {!phoneError && (
                <p className="mt-1 text-xs text-gray-500">
                  International format accepted (7-15 digits)
                </p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Website</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:ring-2 focus:ring-blue-500"
                placeholder="venue.com or https://www.venue.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                https:// will be added automatically if not provided
              </p>
            </div>
          </div>

          {/* Venue Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Venue Type</label>
            <select
              value={formData.venueType}
              onChange={(e) => setFormData({ ...formData, venueType: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about this venue, the piano quality, atmosphere, special events, etc..."
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Submitting venue...
                </span>
              ) : (
                'Submit Venue for Verification'
              )}
            </button>

            <p className="mt-2 text-center text-sm text-gray-500">
              No wallet required - submissions welcome from everyone!
            </p>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 rounded-lg bg-yellow-50 p-4">
          <h3 className="mb-2 font-medium text-yellow-800">How it works:</h3>
          <ol className="space-y-1 text-sm text-yellow-700">
            <li>1. Fill out the venue details in the form above</li>
            <li>2. Submit directly to our database (no wallet required)</li>
            <li>3. A curator will visit and verify the venue information</li>
            <li>4. Once approved, the venue becomes searchable by the community</li>
            <li>5. Help build the largest database of piano-friendly venues!</li>
          </ol>

          <div className="mt-3 text-xs text-yellow-600">
            <p>
              <strong>No Fees:</strong> Submitting venues is completely free!
            </p>
            <p>
              <strong>Verification:</strong> All submissions are manually verified before appearing
              in search
            </p>
            <p>
              <strong>Optional Credit:</strong> Connect your wallet to get credited for submissions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
