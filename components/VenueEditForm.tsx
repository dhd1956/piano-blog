import React, { useState, useEffect } from 'react'
import {
  Venue,
  VenueMetadata,
  VenueUpdateForm,
  VENUE_TYPES,
  PIANO_TYPES,
  PIANO_CONDITIONS,
} from '@/types/venue'
import { PermissionCheck } from '@/utils/permissions'

interface VenueEditFormProps {
  venue: Venue
  extendedData?: VenueMetadata
  permissions: PermissionCheck
  onSave: (updatedData: VenueUpdateForm) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function VenueEditForm({
  venue,
  extendedData,
  permissions,
  onSave,
  onCancel,
  isSubmitting = false,
}: VenueEditFormProps) {
  const [formData, setFormData] = useState<VenueUpdateForm>({
    name: venue.name,
    city: venue.city,
    province: venue.province || '',
    country: venue.country || 'Canada',
    fullAddress: venue.fullAddress,
    venueType: venue.venueType,
    contactType: venue.contactType,
    contactInfo: venue.contactInfo,
    description: extendedData?.venueDetails?.description || '',
    website: extendedData?.venueDetails?.website || '',
    hasPiano: venue.hasPiano,
    hasJamSession: venue.hasJamSession,
    isVirtual: venue.isVirtual || false,
    pianoType: extendedData?.musicalInfo?.pianoType || '',
    pianoCondition: extendedData?.musicalInfo?.pianoCondition || '',
    pianoBrand: extendedData?.musicalInfo?.pianoBrand || '',
    lastTuned: extendedData?.musicalInfo?.lastTuned || '',
    jamSchedule: extendedData?.musicalInfo?.jamSchedule || '',
    jamFrequency: extendedData?.musicalInfo?.jamFrequency || '',
    jamGenres: extendedData?.musicalInfo?.jamGenres || [],
    operatingHours: extendedData?.operationalInfo?.operatingHours?.notes || '',
    wheelchairAccessible:
      extendedData?.operationalInfo?.accessibility?.wheelchairAccessible || false,
    parkingAvailable: extendedData?.operationalInfo?.accessibility?.parkingAvailable || false,
    publicTransportNear: extendedData?.operationalInfo?.accessibility?.publicTransportNear || false,
    specialNotes: extendedData?.operationalInfo?.ambiance?.atmosphere || '',
    facebook: extendedData?.venueDetails?.socialMedia?.facebook || '',
    instagram: extendedData?.venueDetails?.socialMedia?.instagram || '',
    twitter: extendedData?.venueDetails?.socialMedia?.twitter || '',
    curatorNotes: extendedData?.curatorInfo?.curatorNotes || venue.curatorNotes || '',
    curatorRating: extendedData?.curatorInfo?.curatorRating,
    followUpNeeded: extendedData?.curatorInfo?.followUpNeeded || false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isLookingUpAddress, setIsLookingUpAddress] = useState(false)

  // Update form data when props change (e.g., when extendedData loads)
  useEffect(() => {
    setFormData({
      name: venue.name,
      city: venue.city,
      province: venue.province || '',
      country: venue.country || 'Canada',
      fullAddress: venue.fullAddress,
      venueType: venue.venueType,
      contactType: venue.contactType,
      contactInfo: venue.contactInfo,
      description: extendedData?.venueDetails?.description || '',
      website: extendedData?.venueDetails?.website || '',
      hasPiano: venue.hasPiano,
      hasJamSession: venue.hasJamSession,
      isVirtual: venue.isVirtual || false,
      pianoType: extendedData?.musicalInfo?.pianoType || '',
      pianoCondition: extendedData?.musicalInfo?.pianoCondition || '',
      pianoBrand: extendedData?.musicalInfo?.pianoBrand || '',
      lastTuned: extendedData?.musicalInfo?.lastTuned || '',
      jamSchedule: extendedData?.musicalInfo?.jamSchedule || '',
      jamFrequency: extendedData?.musicalInfo?.jamFrequency || '',
      jamGenres: extendedData?.musicalInfo?.jamGenres || [],
      operatingHours: extendedData?.operationalInfo?.operatingHours?.notes || '',
      wheelchairAccessible:
        extendedData?.operationalInfo?.accessibility?.wheelchairAccessible || false,
      parkingAvailable: extendedData?.operationalInfo?.accessibility?.parkingAvailable || false,
      publicTransportNear:
        extendedData?.operationalInfo?.accessibility?.publicTransportNear || false,
      specialNotes: extendedData?.operationalInfo?.ambiance?.atmosphere || '',
      facebook: extendedData?.venueDetails?.socialMedia?.facebook || '',
      instagram: extendedData?.venueDetails?.socialMedia?.instagram || '',
      twitter: extendedData?.venueDetails?.socialMedia?.twitter || '',
      curatorNotes: extendedData?.curatorInfo?.curatorNotes || venue.curatorNotes || '',
      curatorRating: extendedData?.curatorInfo?.curatorRating,
      followUpNeeded: extendedData?.curatorInfo?.followUpNeeded || false,
    })
  }, [venue, extendedData])

  const handleInputChange = (
    field: keyof VenueUpdateForm,
    value: string | number | boolean | string[]
  ) => {
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

  // Handle address lookup using OpenStreetMap
  const handleAddressLookup = async () => {
    if (!formData.name || !formData.city) {
      setErrors((prev) => ({
        ...prev,
        fullAddress: 'Venue name and city are required for address lookup',
      }))
      return
    }

    setIsLookingUpAddress(true)

    try {
      const response = await fetch('/api/venues/lookup-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueName: formData.name,
          city: formData.city,
          province: formData.province,
          country: formData.country,
        }),
      })

      const data = await response.json()

      if (data.success && data.address) {
        setFormData((prev) => ({ ...prev, fullAddress: data.address }))
        // Clear error for address field
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.fullAddress
          return newErrors
        })
      } else {
        setErrors((prev) => ({
          ...prev,
          fullAddress: data.error || 'Could not find address. Please enter manually.',
        }))
      }
    } catch (err: any) {
      console.error('Error looking up address:', err)
      setErrors((prev) => ({
        ...prev,
        fullAddress: 'Failed to lookup address. Please enter manually.',
      }))
    } finally {
      setIsLookingUpAddress(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Venue name is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    // fullAddress is optional since our simplified contract doesn't have this field
    // if (!formData.fullAddress.trim()) {
    //   newErrors.fullAddress = 'Address is required'
    // }

    // Contact type should be optional since our simplified contract doesn't require it
    // if (formData.contactInfo && !formData.contactType) {
    //   newErrors.contactType = 'Contact type is required when contact info is provided'
    // }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving venue:', error)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-900">
      <div className="bg-primary-50 border-b border-gray-200 px-8 py-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Venue Details</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Update venue information. Changes will be recorded on the blockchain.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-8">
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField label="Venue Name" required error={errors.name}>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              maxLength={64}
              placeholder="Jazz Room Toronto"
            />
          </FormField>

          <FormField label="City" required error={errors.city}>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              maxLength={32}
              placeholder="Toronto"
            />
          </FormField>
        </div>

        {/* Province / State and Country */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Country">
            <select
              value={formData.country || 'Canada'}
              onChange={(e) => {
                handleInputChange('country', e.target.value)
                handleInputChange('province', '')
              }}
              className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="Canada">Canada</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Ireland">Ireland</option>
              <option value="Australia">Australia</option>
              <option value="Other">Other</option>
            </select>
          </FormField>
          <FormField label={formData.country === 'United States' ? 'State' : 'Province'}>
            {(formData.country === 'Canada' || !formData.country) && (
              <select
                value={formData.province || ''}
                onChange={(e) => handleInputChange('province', e.target.value)}
                className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Select province…</option>
                <option value="Alberta">Alberta</option>
                <option value="British Columbia">British Columbia</option>
                <option value="Manitoba">Manitoba</option>
                <option value="New Brunswick">New Brunswick</option>
                <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                <option value="Northwest Territories">Northwest Territories</option>
                <option value="Nova Scotia">Nova Scotia</option>
                <option value="Nunavut">Nunavut</option>
                <option value="Ontario">Ontario</option>
                <option value="Prince Edward Island">Prince Edward Island</option>
                <option value="Quebec">Quebec</option>
                <option value="Saskatchewan">Saskatchewan</option>
                <option value="Yukon">Yukon</option>
              </select>
            )}
            {formData.country === 'United States' && (
              <select
                value={formData.province || ''}
                onChange={(e) => handleInputChange('province', e.target.value)}
                className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Select state…</option>
                <option value="Alabama">Alabama</option>
                <option value="Alaska">Alaska</option>
                <option value="Arizona">Arizona</option>
                <option value="Arkansas">Arkansas</option>
                <option value="California">California</option>
                <option value="Colorado">Colorado</option>
                <option value="Connecticut">Connecticut</option>
                <option value="Delaware">Delaware</option>
                <option value="Florida">Florida</option>
                <option value="Georgia">Georgia</option>
                <option value="Hawaii">Hawaii</option>
                <option value="Idaho">Idaho</option>
                <option value="Illinois">Illinois</option>
                <option value="Indiana">Indiana</option>
                <option value="Iowa">Iowa</option>
                <option value="Kansas">Kansas</option>
                <option value="Kentucky">Kentucky</option>
                <option value="Louisiana">Louisiana</option>
                <option value="Maine">Maine</option>
                <option value="Maryland">Maryland</option>
                <option value="Massachusetts">Massachusetts</option>
                <option value="Michigan">Michigan</option>
                <option value="Minnesota">Minnesota</option>
                <option value="Mississippi">Mississippi</option>
                <option value="Missouri">Missouri</option>
                <option value="Montana">Montana</option>
                <option value="Nebraska">Nebraska</option>
                <option value="Nevada">Nevada</option>
                <option value="New Hampshire">New Hampshire</option>
                <option value="New Jersey">New Jersey</option>
                <option value="New Mexico">New Mexico</option>
                <option value="New York">New York</option>
                <option value="North Carolina">North Carolina</option>
                <option value="North Dakota">North Dakota</option>
                <option value="Ohio">Ohio</option>
                <option value="Oklahoma">Oklahoma</option>
                <option value="Oregon">Oregon</option>
                <option value="Pennsylvania">Pennsylvania</option>
                <option value="Rhode Island">Rhode Island</option>
                <option value="South Carolina">South Carolina</option>
                <option value="South Dakota">South Dakota</option>
                <option value="Tennessee">Tennessee</option>
                <option value="Texas">Texas</option>
                <option value="Utah">Utah</option>
                <option value="Vermont">Vermont</option>
                <option value="Virginia">Virginia</option>
                <option value="Washington">Washington</option>
                <option value="West Virginia">West Virginia</option>
                <option value="Wisconsin">Wisconsin</option>
                <option value="Wyoming">Wyoming</option>
              </select>
            )}
            {formData.country !== 'Canada' &&
              formData.country !== 'United States' &&
              formData.country && (
                <input
                  type="text"
                  value={formData.province || ''}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Province / State / Region"
                />
              )}
          </FormField>
        </div>

        {/* Virtual Venue Toggle */}
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isVirtual || false}
            onChange={(e) => handleInputChange('isVirtual', e.target.checked)}
            className="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <span className="text-gray-700 dark:text-gray-300">
            🌐 This is a virtual/online-only venue (no physical address)
          </span>
        </label>

        {/* Address */}
        {!formData.isVirtual && (
          <FormField label="Full Address" required error={errors.fullAddress}>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.fullAddress}
                onChange={(e) => handleInputChange('fullAddress', e.target.value)}
                className="focus:ring-primary-500 focus:border-primary-500 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                placeholder="456 Queen Street West, Toronto, ON M5V 2A8"
              />
              <button
                type="button"
                onClick={handleAddressLookup}
                disabled={isLookingUpAddress}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
                title="Auto-fill address using OpenStreetMap"
              >
                {isLookingUpAddress ? '⏳' : '🤖'}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              💡 Click 🤖 to auto-fill address using venue name and city
            </p>
          </FormField>
        )}

        {/* Venue Type */}
        <FormField label="Venue Type">
          <select
            value={formData.venueType}
            onChange={(e) => handleInputChange('venueType', parseInt(e.target.value))}
            className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {VENUE_TYPES.map((type, index) => (
              <option key={index} value={index}>
                {type}
              </option>
            ))}
          </select>
        </FormField>

        {/* Description */}
        <FormField label="About This Venue">
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            rows={4}
            maxLength={500}
            placeholder="Describe the venue, its atmosphere, what makes it special..."
          />
          <div className="mt-1 text-right text-xs text-gray-500">
            {formData.description?.length || 0}/500 characters
          </div>
        </FormField>

        {/* Contact Information */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField label="Contact Type">
            <select
              value={formData.contactType}
              onChange={(e) => handleInputChange('contactType', e.target.value)}
              className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="website">Website</option>
              <option value="social">Social Media</option>
            </select>
          </FormField>

          <FormField label="Contact Information" error={errors.contactInfo}>
            <input
              type="text"
              value={formData.contactInfo || ''}
              onChange={(e) => handleInputChange('contactInfo', e.target.value)}
              className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              placeholder="manager@venue.com"
            />
          </FormField>
        </div>

        {/* Features */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Features</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.hasPiano}
                onChange={(e) => handleInputChange('hasPiano', e.target.checked)}
                className="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-gray-700 dark:text-gray-300">🎹 Has Piano Available</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.hasJamSession}
                onChange={(e) => handleInputChange('hasJamSession', e.target.checked)}
                className="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-gray-700 dark:text-gray-300">🎵 Hosts Jam Sessions</span>
            </label>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-2 font-medium"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-6 border-t border-gray-200 pt-6 dark:border-gray-700">
            {/* Piano Details */}
            {formData.hasPiano && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField label="Piano Type">
                  <select
                    value={formData.pianoType || ''}
                    onChange={(e) => handleInputChange('pianoType', e.target.value)}
                    className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Select Type</option>
                    {PIANO_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Piano Condition">
                  <select
                    value={formData.pianoCondition || ''}
                    onChange={(e) => handleInputChange('pianoCondition', e.target.value)}
                    className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Select Condition</option>
                    {PIANO_CONDITIONS.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition.charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            )}

            {/* Jam Session Details */}
            {formData.hasJamSession && (
              <FormField label="Jam Session Schedule">
                <textarea
                  value={formData.jamSchedule || ''}
                  onChange={(e) => handleInputChange('jamSchedule', e.target.value)}
                  rows={2}
                  className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="e.g., Every Friday 8-11 PM, Open mic nights"
                />
              </FormField>
            )}

            {/* Operating Hours */}
            <FormField label="Operating Hours">
              <textarea
                value={formData.operatingHours || ''}
                onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                rows={3}
                className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Mon-Thu: 7 AM - 11 PM, Fri-Sat: 7 AM - 12 AM, Sun: 8 AM - 10 PM"
              />
            </FormField>

            {/* Website */}
            <FormField label="Website">
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                placeholder="https://www.venue.com"
              />
            </FormField>

            {/* Social Media */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField label="Facebook">
                <input
                  type="url"
                  value={formData.facebook || ''}
                  onChange={(e) => handleInputChange('facebook', e.target.value)}
                  className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Facebook URL"
                />
              </FormField>

              <FormField label="Instagram">
                <input
                  type="url"
                  value={formData.instagram || ''}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Instagram URL"
                />
              </FormField>

              <FormField label="Twitter">
                <input
                  type="url"
                  value={formData.twitter || ''}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Twitter URL"
                />
              </FormField>
            </div>

            {/* Accessibility Options */}
            <div>
              <h4 className="mb-3 font-medium text-gray-900 dark:text-gray-100">Accessibility</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.wheelchairAccessible || false}
                    onChange={(e) => handleInputChange('wheelchairAccessible', e.target.checked)}
                    className="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-gray-700 dark:text-gray-300">♿ Wheelchair Accessible</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.parkingAvailable || false}
                    onChange={(e) => handleInputChange('parkingAvailable', e.target.checked)}
                    className="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-gray-700 dark:text-gray-300">🅿️ Parking Available</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.publicTransportNear || false}
                    onChange={(e) => handleInputChange('publicTransportNear', e.target.checked)}
                    className="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-gray-700 dark:text-gray-300">🚇 Near Public Transport</span>
                </label>
              </div>
            </div>

            {/* Special Notes */}
            <FormField label="Special Notes">
              <textarea
                value={formData.specialNotes || ''}
                onChange={(e) => handleInputChange('specialNotes', e.target.value)}
                rows={3}
                className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Any special instructions, rules, or notes about this venue..."
              />
            </FormField>
          </div>
        )}

        {/* Curator-Only Section */}
        {(permissions.isBlogOwner || permissions.isVenueCurator) && (
          <div className="rounded-lg border-t border-gray-200 bg-amber-50 p-4 pt-6 dark:border-gray-700 dark:bg-amber-900/20">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Curator Section
            </h3>

            <FormField label="Curator Notes">
              <textarea
                value={formData.curatorNotes || venue.curatorNotes}
                onChange={(e) => handleInputChange('curatorNotes', e.target.value)}
                rows={3}
                className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Internal notes for curators and venue management..."
              />
            </FormField>

            {permissions.isBlogOwner && (
              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField label="Curator Rating (1-5)">
                  <select
                    value={formData.curatorRating || ''}
                    onChange={(e) => handleInputChange('curatorRating', parseInt(e.target.value))}
                    className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">No Rating</option>
                    <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                    <option value={4}>⭐⭐⭐⭐ Good</option>
                    <option value={3}>⭐⭐⭐ Average</option>
                    <option value={2}>⭐⭐ Poor</option>
                    <option value={1}>⭐ Very Poor</option>
                  </select>
                </FormField>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.followUpNeeded || false}
                      onChange={(e) => handleInputChange('followUpNeeded', e.target.checked)}
                      className="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Follow-up Required</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500 rounded-lg px-6 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Helper component for form fields
function FormField({
  label,
  required = false,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
