'use client'

import { useState } from 'react'
import { useHybridWallet } from '@/hooks/useHybridWallet'

export default function SubmitVenue() {
  const { walletAddress, isConnected, connectWallet } = useHybridWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    contactInfo: '',
    contactType: 'email',
    hasPiano: false,
    hasJamSession: false,
    description: '',
    address: '',
    phone: '',
    website: '',
    amenities: [] as string[],
    tags: [] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleArrayChange = (field: 'amenities' | 'tags', value: string) => {
    const items = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    setFormData((prev) => ({ ...prev, [field]: items }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Venue name is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.contactInfo.trim()) {
      newErrors.contactInfo = 'Contact information is required'
    }

    if (!isConnected) {
      newErrors.wallet = 'Please connect your wallet to submit a venue'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          submittedBy: walletAddress,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setFormData({
          name: '',
          city: '',
          contactInfo: '',
          contactType: 'email',
          hasPiano: false,
          hasJamSession: false,
          description: '',
          address: '',
          phone: '',
          website: '',
          amenities: [],
          tags: [],
        })
      } else {
        setError(data.error || 'Failed to submit venue')
      }
    } catch (error: any) {
      console.error('Submission error:', error)
      setError('Network error: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <div className="mb-4 text-6xl">✅</div>
            <h1 className="mb-4 text-2xl font-bold text-green-600">
              Venue Submitted Successfully!
            </h1>
            <p className="mb-6 text-gray-600">
              Your venue has been submitted and will be reviewed by our curators. You'll receive PXP
              tokens as a reward once it's verified!
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setSuccess(false)}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Submit Another Venue
              </button>
              <a
                href="/venues"
                className="rounded-lg bg-gray-600 px-6 py-2 text-white hover:bg-gray-700"
              >
                View All Venues
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">🎹 Submit a Piano Venue</h1>
          <p className="text-gray-600">
            Help grow our community by submitting venues with pianos. Earn 50 PXP tokens when your
            venue is verified!
          </p>
        </div>

        {!isConnected && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-yellow-600">⚠️</span>
              <h3 className="font-medium text-yellow-800">Wallet Connection Required</h3>
            </div>
            <p className="mb-3 text-yellow-700">
              You need to connect your wallet to submit venues and receive PXP token rewards.
            </p>
            <button
              onClick={connectWallet}
              className="rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
            >
              Connect Wallet
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-md">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Venue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Jazz Café Toronto"
                maxLength={64}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Toronto"
                maxLength={32}
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Contact Type</label>
              <select
                value={formData.contactType}
                onChange={(e) => handleInputChange('contactType', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="website">Website</option>
                <option value="social">Social Media</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Contact Information <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contactInfo}
                onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="manager@venue.com"
              />
              {errors.contactInfo && (
                <p className="mt-1 text-sm text-red-600">{errors.contactInfo}</p>
              )}
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Features</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hasPiano}
                  onChange={(e) => handleInputChange('hasPiano', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">🎹 Has Piano Available</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hasJamSession}
                  onChange={(e) => handleInputChange('hasJamSession', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">🎵 Hosts Jam Sessions</span>
              </label>
            </div>
          </div>

          {/* Optional Details */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the venue, atmosphere, piano quality, etc..."
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main St, Toronto, ON"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="(416) 555-0123"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="https://venue.com"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Amenities <span className="text-sm text-gray-500">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={formData.amenities.join(', ')}
                onChange={(e) => handleArrayChange('amenities', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="WiFi, Food, Drinks, Parking"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tags <span className="text-sm text-gray-500">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => handleArrayChange('tags', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="jazz, coffee, live music, cozy"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-600">❌</span>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {errors.wallet && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-yellow-700">{errors.wallet}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !isConnected}
              className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Venue'}
            </button>
          </div>
        </form>

        {/* Information Box */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 font-medium text-blue-800">💡 How it works</h3>
          <ol className="space-y-1 text-sm text-blue-700">
            <li>1. Submit your venue information (stored securely in our database)</li>
            <li>2. Community curators will review and verify your submission</li>
            <li>3. Once approved, you earn 50 PXP tokens as a reward!</li>
            <li>4. Verified venues appear in our directory and can receive PXP payments</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
