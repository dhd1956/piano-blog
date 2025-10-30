'use client'

/**
 * WPB-209: Event Creation Page
 * Allows musicians to create events (jam sessions, gigs, concerts, etc.)
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHybridWallet } from '@/hooks/useHybridWallet'

interface Venue {
  id: number
  name: string
  city: string
  slug: string
}

const EVENT_TYPES = [
  { value: 'JAM_SESSION', label: '🎸 Jam Session' },
  { value: 'GIG', label: '🎤 Gig' },
  { value: 'CONCERT', label: '🎵 Concert' },
  { value: 'RECITAL', label: '🎹 Recital' },
  { value: 'OPEN_MIC', label: '🎙️ Open Mic' },
  { value: 'WORKSHOP', label: '📚 Workshop' },
  { value: 'MASTERCLASS', label: '🎓 Masterclass' },
  { value: 'REHEARSAL', label: '🎼 Rehearsal' },
  { value: 'MEETUP', label: '👥 Meetup' },
  { value: 'OTHER', label: '📌 Other' },
]

export default function CreateEventPage() {
  const router = useRouter()
  const { walletAddress, isConnected, isLoading, connectWallet } = useHybridWallet()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState('JAM_SESSION')
  const [venueId, setVenueId] = useState<number | null>(null)
  const [customLocation, setCustomLocation] = useState('')
  const [address, setAddress] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [maxAttendees, setMaxAttendees] = useState<number | null>(null)
  const [requireApproval, setRequireApproval] = useState(false)
  const [isFree, setIsFree] = useState(true)
  const [price, setPrice] = useState<number | null>(null)
  const [genres, setGenres] = useState<string[]>([])
  const [genreInput, setGenreInput] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [externalLink, setExternalLink] = useState('')
  const [streamingLink, setStreamingLink] = useState('')

  // UI state
  const [venues, setVenues] = useState<Venue[]>([])
  const [loadingVenues, setLoadingVenues] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useCustomLocation, setUseCustomLocation] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  // Check for username session
  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        if (data.user && data.user.username) {
          setUsername(data.user.username)
        }
      }
    }
    checkSession()
  }, [])

  // Load verified venues
  useEffect(() => {
    loadVenues()
  }, [])

  const loadVenues = async () => {
    try {
      setLoadingVenues(true)
      const response = await fetch('/api/venues?verified=true&limit=100')
      if (response.ok) {
        const data = await response.json()
        setVenues(data.venues || [])
      }
    } catch (err) {
      console.error('Error loading venues:', err)
    } finally {
      setLoadingVenues(false)
    }
  }

  const handleAddGenre = () => {
    if (genreInput.trim() && !genres.includes(genreInput.trim())) {
      setGenres([...genres, genreInput.trim()])
      setGenreInput('')
    }
  }

  const handleRemoveGenre = (genre: string) => {
    setGenres(genres.filter((g) => g !== genre))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      // Get organizer address (wallet or username)
      const organizerAddress = walletAddress || username
      if (!organizerAddress) {
        setError('Please connect your wallet or sign in to create an event')
        setSubmitting(false)
        return
      }

      // Validate dates
      if (!startDate || !startTime || !endDate || !endTime) {
        setError('Please provide start and end dates/times')
        setSubmitting(false)
        return
      }

      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`)
      const endDateTime = new Date(`${endDate}T${endTime}`)

      if (startDateTime >= endDateTime) {
        setError('End date/time must be after start date/time')
        setSubmitting(false)
        return
      }

      // Prepare request body
      const requestBody = {
        organizerAddress,
        title,
        description,
        eventType,
        venueId: useCustomLocation ? null : venueId,
        customLocation: useCustomLocation ? customLocation : null,
        address: useCustomLocation ? address : null,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        maxAttendees,
        requireApproval,
        isFree,
        price: isFree ? null : price,
        genres,
        coverImage: coverImage || null,
        externalLink: externalLink || null,
        streamingLink: streamingLink || null,
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create event')
      }

      const data = await response.json()
      router.push(`/events/${data.event.id}`)
    } catch (err: any) {
      console.error('Error creating event:', err)
      setError(err.message || 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  // Show connect wallet message if not connected
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!isConnected && !username) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">Create Event</h1>
        <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
          Please connect your wallet or sign in to create an event
        </p>
        <button
          onClick={connectWallet}
          className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">Create Event</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Organize a jam session, gig, concert, or musical gathering
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="Summer Jazz Jam Session"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Event Type *
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="Describe your event..."
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Location</h2>

          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useCustomLocation}
                onChange={(e) => setUseCustomLocation(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Use custom location (not a registered venue)
              </span>
            </label>
          </div>

          {!useCustomLocation ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Venue
              </label>
              <select
                value={venueId || ''}
                onChange={(e) => setVenueId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="">Select a venue...</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.city}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location Name
                </label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="My Studio, Community Center, etc."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="123 Main St, City, State"
                />
              </div>
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Date & Time</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Event Settings */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            Event Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Attendees (optional)
              </label>
              <input
                type="number"
                value={maxAttendees || ''}
                onChange={(e) => setMaxAttendees(e.target.value ? parseInt(e.target.value) : null)}
                min="1"
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Require organizer approval for RSVPs
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Free event</span>
              </label>
            </div>

            {!isFree && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price (USD)
                </label>
                <input
                  type="number"
                  value={price || ''}
                  onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : null)}
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="10.00"
                />
              </div>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            Additional Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Music Genres/Styles
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGenre())}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Jazz, Blues, Classical..."
                />
                <button
                  type="button"
                  onClick={handleAddGenre}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {genre}
                    <button
                      type="button"
                      onClick={() => handleRemoveGenre(genre)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cover Image URL (optional)
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="https://example.com/event-image.jpg"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                External Event Link (optional)
              </label>
              <input
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="https://eventbrite.com/..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Streaming Link (optional)
              </label>
              <input
                type="url"
                value={streamingLink}
                onChange={(e) => setStreamingLink(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="https://youtube.com/live/..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
}
